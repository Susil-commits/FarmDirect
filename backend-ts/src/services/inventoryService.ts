import mongoose, { type Types } from 'mongoose';
import SalesDaily from '../models/SalesDaily.js';
import CropListing from '../models/CropListing.js';
import Notification from '../models/Notification.js';
import { emitToUser } from '../socket/socketManager.js';
import { CropStatus, CropAvailability, NotificationType, NotificationPriority } from '../types/enums.js';
import logger from '../utils/logger.js';

export interface DaysOfCoverResult {
  cropId: string;
  cropName: string;
  currentStock: number;
  unit: string;
  dailyVelocity: number;
  daysOfCover: number | null;
  urgency: 'critical' | 'warning' | 'adequate' | 'no_recent_sales';
}

function normalizeDateToMidnight(d: Date): Date {
  const normalized = new Date(d);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Record completed sale in SalesDaily aggregation collection (T4.4)
 */
export async function recordOrderSalesDaily(order: {
  cropId: Types.ObjectId | string;
  farmerId: Types.ObjectId | string;
  quantity: number;
  totalAmount: number;
  date?: Date;
}): Promise<void> {
  try {
    const cropId = typeof order.cropId === 'string' ? new mongoose.Types.ObjectId(order.cropId) : order.cropId;
    const farmerId = typeof order.farmerId === 'string' ? new mongoose.Types.ObjectId(order.farmerId) : order.farmerId;
    const date = normalizeDateToMidnight(order.date || new Date());

    await SalesDaily.findOneAndUpdate(
      { cropId, date },
      {
        $setOnInsert: { farmerId },
        $inc: {
          quantitySold: Number(order.quantity || 0),
          revenue: Number(order.totalAmount || 0),
          orderCount: 1,
        },
      },
      { upsert: true, new: true }
    );
  } catch (err: any) {
    logger.warn({ err: err?.message || err, cropId: order.cropId }, 'Failed to record SalesDaily aggregation');
  }
}

/**
 * Calculate days of cover for a single crop listing: stock / recent daily sales velocity (T4.4)
 */
export async function calculateCropDaysOfCover(
  cropId: string | Types.ObjectId,
  currentStock: number,
  lookbackDays = 14
): Promise<{ daysOfCover: number | null; dailyVelocity: number; totalSold: number }> {
  const parsedId = typeof cropId === 'string' ? new mongoose.Types.ObjectId(cropId) : cropId;
  const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  const salesRecords = await SalesDaily.find({
    cropId: parsedId,
    date: { $gte: cutoff },
  }).lean();

  const totalSold = salesRecords.reduce((sum, r) => sum + (r.quantitySold || 0), 0);
  const dailyVelocity = totalSold / Math.max(1, lookbackDays);

  if (dailyVelocity <= 0.001) {
    return {
      daysOfCover: null,
      dailyVelocity: 0,
      totalSold: 0,
    };
  }

  const daysOfCover = Number((currentStock / dailyVelocity).toFixed(1));
  return {
    daysOfCover,
    dailyVelocity: Number(dailyVelocity.toFixed(2)),
    totalSold,
  };
}

/**
 * Scan all active crop listings for a farmer and compute dynamic days-of-cover smart low stock (T4.4)
 */
export async function evaluateFarmerSmartLowStock(
  farmerId: string | Types.ObjectId,
  sendNotifications = false
): Promise<DaysOfCoverResult[]> {
  const parsedFarmerId = typeof farmerId === 'string' ? new mongoose.Types.ObjectId(farmerId) : farmerId;

  const crops = await CropListing.find({
    farmerId: parsedFarmerId,
    status: CropStatus.Active,
    availability: CropAvailability.Available,
  }).lean();

  const results: DaysOfCoverResult[] = [];

  for (const crop of crops) {
    const { daysOfCover, dailyVelocity } = await calculateCropDaysOfCover(
      crop._id,
      Number(crop.quantity || 0),
      14
    );

    let urgency: DaysOfCoverResult['urgency'] = 'adequate';
    if (daysOfCover === null) {
      urgency = Number(crop.quantity) <= Number(crop.lowStockThreshold || 10) ? 'warning' : 'no_recent_sales';
    } else if (daysOfCover <= 3.0) {
      urgency = 'critical';
    } else if (daysOfCover <= 5.0) {
      urgency = 'warning';
    }

    results.push({
      cropId: String(crop._id),
      cropName: crop.cropName,
      currentStock: Number(crop.quantity || 0),
      unit: String(crop.unit || 'kg'),
      dailyVelocity,
      daysOfCover,
      urgency,
    });

    if (sendNotifications && (urgency === 'critical' || urgency === 'warning')) {
      const isCritical = urgency === 'critical';
      const title = isCritical
        ? `⚠️ Critical Stock Alert: ${crop.cropName}`
        : `Low Stock Warning: ${crop.cropName}`;
      const message = daysOfCover !== null
        ? `${crop.cropName} has approximately ${daysOfCover} days of stock remaining at current sales velocity (${dailyVelocity} ${crop.unit}/day). Restock soon!`
        : `${crop.cropName} inventory is low (${crop.quantity} ${crop.unit} remaining).`;

      const notif = await Notification.create({
        userId: parsedFarmerId,
        title,
        message,
        type: NotificationType.Inventory,
        relatedId: String(crop._id),
        priority: isCritical ? NotificationPriority.High : NotificationPriority.Medium,
        actionUrl: `/farmer/inventory`,
      });

      emitToUser(String(parsedFarmerId), 'notification:new', notif);
    }
  }

  return results;
}
