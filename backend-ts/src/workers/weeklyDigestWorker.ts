import mongoose, { type Types } from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import CropListing from '../models/CropListing.js';
import Notification from '../models/Notification.js';
import { redisClient } from '../config/redis.js';
import { llmClient } from '../ai/llmClient.js';
import { emitToUser } from '../socket/socketManager.js';
import { UserRole, UserStatus, OrderStatus, NotificationType, NotificationPriority } from '../types/enums.js';
import { calculateCropDaysOfCover } from '../services/inventoryService.js';
import logger from '../utils/logger.js';

let isDigestRunning = false;

export interface WeeklyFarmerKpis {
  farmerId: string;
  farmerName: string;
  orderCount: number;
  totalRevenue: number;
  topCropName: string | null;
  topCropSales: number;
  lowCoverCrops: string[];
}

/**
 * Compute 7-day farmer performance metrics strictly in deterministic code
 */
export async function computeFarmerWeeklyKpis(farmerId: Types.ObjectId | string): Promise<WeeklyFarmerKpis> {
  const parsedFarmerId = typeof farmerId === 'string' ? new mongoose.Types.ObjectId(farmerId) : farmerId;
  const farmer = await User.findById(parsedFarmerId).lean();
  const farmerName = farmer ? `${farmer.firstName} ${farmer.lastName}`.trim() : 'Farmer';

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const orders = await Order.find({
    farmerId: parsedFarmerId,
    orderStatus: OrderStatus.Completed,
    createdAt: { $gte: sevenDaysAgo },
  }).lean();

  const orderCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  // Top crop
  const cropSalesMap = new Map<string, { name: string; quantity: number }>();
  for (const o of orders) {
    const cId = String(o.cropId);
    const existing = cropSalesMap.get(cId) || { name: o.cropName || 'Produce', quantity: 0 };
    existing.quantity += Number(o.quantity || 0);
    cropSalesMap.set(cId, existing);
  }

  let topCropName: string | null = null;
  let topCropSales = 0;
  for (const [, item] of cropSalesMap.entries()) {
    if (item.quantity > topCropSales) {
      topCropSales = item.quantity;
      topCropName = item.name;
    }
  }

  // Active listings low cover check
  const activeCrops = await CropListing.find({
    farmerId: parsedFarmerId,
    status: 'active',
  }).lean();

  const lowCoverCrops: string[] = [];
  for (const c of activeCrops) {
    const { daysOfCover } = await calculateCropDaysOfCover(c._id, Number(c.quantity || 0), 14);
    if (daysOfCover !== null && daysOfCover <= 3.0) {
      lowCoverCrops.push(c.cropName);
    }
  }

  return {
    farmerId: String(parsedFarmerId),
    farmerName,
    orderCount,
    totalRevenue,
    topCropName,
    topCropSales,
    lowCoverCrops,
  };
}

/**
 * Generate and deliver weekly performance digest for a single farmer (T4.5)
 */
export async function generateWeeklyDigestForFarmer(
  farmerId: Types.ObjectId | string,
  preferredLanguage: 'en' | 'hi' | 'od' = 'en'
): Promise<any> {
  const kpis = await computeFarmerWeeklyKpis(farmerId);

  // Check farmer notification preferences
  const farmer = await User.findById(farmerId).lean();
  if (farmer?.notificationPreferences?.cropUpdates === false) {
    logger.info({ farmerId }, 'Skipping weekly digest due to user notificationPreferences');
    return null;
  }

  // Factual English base text
  let baseSummary = `Weekly Farm Digest: You fulfilled ${kpis.orderCount} orders generating ₹${kpis.totalRevenue.toLocaleString('en-IN')} in revenue this week.`;
  if (kpis.topCropName) {
    baseSummary += ` Top performing crop: ${kpis.topCropName} (${kpis.topCropSales} units sold).`;
  }
  if (kpis.lowCoverCrops.length > 0) {
    baseSummary += ` Attention: Stock for ${kpis.lowCoverCrops.join(', ')} is running low (≤ 3 days of cover).`;
  } else {
    baseSummary += ` All crop inventory levels are currently healthy.`;
  }

  // LLM narrates in user preferred language if configured
  let finalMessage = baseSummary;
  if (preferredLanguage !== 'en' && llmClient.isConfigured()) {
    try {
      const langName = preferredLanguage === 'hi' ? 'Hindi' : 'Odia';
      const prompt = `Narrate this farmer weekly performance summary in warm, encouraging, simple ${langName} without altering any numbers or facts:\n"${baseSummary}"`;
      const res = await llmClient.generateText({ prompt, maxOutputTokens: 150, temperature: 0.2 });
      if (res?.text && res.text.trim().length > 0) {
        finalMessage = res.text.trim();
      }
    } catch (err: any) {
      logger.warn({ err: err?.message || err, farmerId }, 'LLM digest narration failed, using factual English');
    }
  }

  const notification = await Notification.create({
    userId: farmerId,
    title: preferredLanguage === 'hi' ? 'साप्ताहिक कृषि रिपोर्ट' : (preferredLanguage === 'od' ? 'ସାପ୍ତାହିକ କୃଷି ରିପୋର୍ଟ' : 'Weekly Farm Performance Digest'),
    message: finalMessage,
    type: NotificationType.General,
    priority: NotificationPriority.Medium,
    actionUrl: '/farmer/dashboard',
    data: {
      kpis,
    },
  });

  emitToUser(String(farmerId), 'notification:new', notification);
  return notification;
}

/**
 * Execute cluster-safe single-instance guarded weekly digest runner across all active farmers
 */
export async function runWeeklyDigestJob(): Promise<{ processed: number; skipped: number }> {
  // 1. Single-instance guard via Redis Lock or In-Process Mutex
  const lockKey = 'lock:weekly_digest_job';
  let hasLock = false;

  if (redisClient && redisClient.isOpen) {
    try {
      // 30 minute TTL for lock
      const acquired = await redisClient.set(lockKey, 'locked', { NX: true, EX: 1800 });
      if (!acquired) {
        logger.info('Weekly digest job already running on another instance, skipping.');
        return { processed: 0, skipped: 0 };
      }
      hasLock = true;
    } catch {
      // In-process fallback lock
    }
  }

  if (!hasLock) {
    if (isDigestRunning) {
      logger.info('Weekly digest job already active locally, skipping.');
      return { processed: 0, skipped: 0 };
    }
    isDigestRunning = true;
  }

  try {
    const farmers = await User.find({
      role: UserRole.Farmer,
      status: UserStatus.Active,
    }).lean().select('_id state city notificationPreferences');

    let processed = 0;
    let skipped = 0;

    for (const farmer of farmers) {
      try {
        const lang = (farmer.state?.toLowerCase().includes('odisha') ? 'od' : 'en') as 'en' | 'hi' | 'od';
        const res = await generateWeeklyDigestForFarmer(farmer._id, lang);
        if (res) processed++;
        else skipped++;
      } catch (err: any) {
        logger.warn({ err: err?.message || err, farmerId: farmer._id }, 'Error creating weekly digest for farmer');
        skipped++;
      }
    }

    logger.info({ processed, skipped }, 'Completed weekly digest batch processing');
    return { processed, skipped };
  } finally {
    isDigestRunning = false;
    if (hasLock && redisClient && redisClient.isOpen) {
      await redisClient.del(lockKey).catch(() => {});
    }
  }
}
