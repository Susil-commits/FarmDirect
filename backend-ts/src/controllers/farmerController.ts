import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendError } from '../utils/apiResponse.js';
import { OrderStatus } from '../types/enums.js';
import type { Request, Response, NextFunction } from 'express';

function calculatePerformanceScore(crop: { rating?: number; views?: number; sold?: number }, orderCount: number): number {
  let score = 0;
  score += (crop.rating || 0) * 8;
  const conversionRate = (crop.views ?? 0) > 0 ? (crop.sold ?? 0) / (crop.views ?? 1) : 0;
  score += Math.min(conversionRate * 100, 30);
  score += Math.min(((crop.sold ?? 0) / 100) * 30, 30);
  return Math.min(Math.round(score), 100);
}

function getStartDate(period: string): Date {
  const now = new Date();
  const start = new Date();
  switch (period) {
    case 'week': start.setDate(now.getDate() - 7); break;
    case 'year': start.setFullYear(now.getFullYear() - 1); break;
    case 'month':
    default: start.setMonth(now.getMonth() - 1);
  }
  return start;
}

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;

    // B15 FIX: Replace load-all-into-memory find() with aggregate queries that
    // return only computed scalars. Previously this endpoint loaded every crop
    // document and every order document for a farmer — O(n) memory per request.
    const [cropStats, orderStats] = await Promise.all([
      CropListing.aggregate([
        { $match: { farmerId } },
        {
          $group: {
            _id: null,
            totalCrops: { $sum: 1 },
            totalActiveListing: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            totalApprovedListing: { $sum: { $cond: [{ $eq: ['$listingApprovalStatus', 'approved'] }, 1, 0] } },
            totalPendingListing: { $sum: { $cond: [{ $eq: ['$listingApprovalStatus', 'pending'] }, 1, 0] } },
            totalRejectedListing: { $sum: { $cond: [{ $eq: ['$listingApprovalStatus', 'rejected'] }, 1, 0] } },
            totalInventory: { $sum: '$quantity' },
            lowStockItems: {
              $sum: { $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0] },
            },
            soldOut: { $sum: { $cond: [{ $eq: ['$status', 'soldOut'] }, 1, 0] } },
            totalUnitsSold: { $sum: '$sold' },
            avgRating: { $avg: '$rating' },
          },
        },
      ]),
      Order.aggregate([
        { $match: { farmerId } },
        {
          $group: {
            _id: null,
            totalOrdersReceived: { $sum: 1 },
            completedOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', OrderStatus.Completed] }, 1, 0] } },
            pendingOrders: {
              $sum: {
                $cond: [
                  { $in: ['$orderStatus', [OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.ReadyForPickup, OrderStatus.PickedUp]] },
                  1,
                  0,
                ],
              },
            },
            cancelledOrders: { $sum: { $cond: [{ $eq: ['$orderStatus', OrderStatus.Cancelled] }, 1, 0] } },
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$orderStatus', OrderStatus.Completed] }, '$totalAmount', 0] },
            },
          },
        },
      ]),
    ]);

    const c = cropStats[0] ?? {};
    const o = orderStats[0] ?? {};

    const stats = {
      totalActiveListing: c.totalActiveListing ?? 0,
      totalApprovedListing: c.totalApprovedListing ?? 0,
      totalPendingListing: c.totalPendingListing ?? 0,
      totalRejectedListing: c.totalRejectedListing ?? 0,
      totalCrops: c.totalCrops ?? 0,
      totalRevenue: o.totalRevenue ?? 0,
      totalOrdersReceived: o.totalOrdersReceived ?? 0,
      completedOrders: o.completedOrders ?? 0,
      pendingOrders: o.pendingOrders ?? 0,
      cancelledOrders: o.cancelledOrders ?? 0,
      totalInventory: c.totalInventory ?? 0,
      lowStockItems: c.lowStockItems ?? 0,
      soldOut: c.soldOut ?? 0,
      averageRating: c.avgRating != null ? Number(c.avgRating.toFixed(2)) : 0,
      totalUnitsSold: c.totalUnitsSold ?? 0,
    };
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getCropAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const { period = 'month' } = req.query as Record<string, string>;
    const startDate = getStartDate(period);
    const now = new Date();

    const [orders, crops] = await Promise.all([
      Order.find({ farmerId, createdAt: { $gte: startDate, $lte: now } }).populate('cropId', 'cropName category price').lean(),
      CropListing.find({ farmerId }).select('cropName category price rating totalReviews views sold quantity status').lean(),
    ]);

    const analytics = crops.map((crop) => {
      const cropOrders = orders.filter((o) => (o.cropId as unknown as { _id?: string })?._id?.toString() === String(crop._id));
      const completedCropOrders = cropOrders.filter((o) => o.orderStatus === OrderStatus.Completed);
      return {
        cropId: crop._id, cropName: crop.cropName, category: crop.category, price: crop.price,
        rating: crop.rating, reviews: crop.totalReviews, views: crop.views,
        unitsSold: crop.sold, ordersReceived: cropOrders.length,
        totalRevenue: completedCropOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        avgOrderValue: completedCropOrders.length > 0 ? (completedCropOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / completedCropOrders.length).toFixed(2) : 0,
        conversionRate: (crop.views ?? 0) > 0 ? (((crop.sold ?? 0) / (crop.views ?? 1)) * 100).toFixed(2) : 0,
        currentQuantity: crop.quantity, status: crop.status,
        performanceScore: calculatePerformanceScore(crop, cropOrders.length),
      };
    });
    analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.status(200).json({
      success: true, period, data: analytics,
      summary: {
        totalCrops: crops.length,
        totalRevenue: analytics.reduce((sum, a) => sum + a.totalRevenue, 0),
        totalOrders: orders.length,
        avgConversionRate: analytics.length > 0 ? (analytics.reduce((sum, a) => sum + parseFloat(String(a.conversionRate)), 0) / analytics.length).toFixed(2) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const { period = 'month' } = req.query as Record<string, string>;
    const now = new Date();
    const startDate = getStartDate(period);
    let groupBy = '%Y-%m-%d';
    if (period === 'year') groupBy = '%Y-%m';

    const revenueData = await Order.aggregate([
      { $match: { farmerId, createdAt: { $gte: startDate, $lte: now }, orderStatus: OrderStatus.Completed } },
      { $group: { _id: { $dateToString: { format: groupBy, date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 }, units: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } },
    ]);

    const chartData = revenueData.map((item) => ({ date: item._id, revenue: item.revenue, orders: item.orders, units: item.units }));
    const totals = {
      totalRevenue: chartData.reduce((sum, item) => sum + item.revenue, 0),
      totalOrders: chartData.reduce((sum, item) => sum + item.orders, 0),
      totalUnits: chartData.reduce((sum, item) => sum + item.units, 0),
      avgDailyRevenue: (chartData.reduce((sum, item) => sum + item.revenue, 0) / (chartData.length || 1)).toFixed(2),
    };
    res.status(200).json({ success: true, period, data: chartData, totals });
  } catch (error) {
    next(error);
  }
}

export async function getLowStockItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const lowStockItems = await CropListing.find({ farmerId, $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .select('cropName category quantity lowStockThreshold price status').sort({ quantity: 1 }).lean();
    res.status(200).json({ success: true, count: lowStockItems.length, data: lowStockItems });
  } catch (error) {
    next(error);
  }
}

export async function updateLowStockThreshold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cropId, threshold } = req.body as { cropId: string; threshold: number };
    const farmerId = req.user!._id;
    if (!cropId || threshold === undefined) { sendError(res, 'cropId and threshold are required', 400); return; }
    if (threshold < 0) { sendError(res, 'Threshold cannot be negative', 400); return; }

    // Include farmerId in filter so a farmer cannot edit another farmer's crop (Task 3.7)
    const crop = await CropListing.findOneAndUpdate(
      { _id: cropId, farmerId },
      { lowStockThreshold: threshold },
      { new: true, runValidators: true },
    );
    if (!crop) { sendError(res, 'Crop not found or you are not authorized to modify it', 403); return; }
    res.status(200).json({ success: true, message: 'Low stock threshold updated successfully', data: crop });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const { period = 'month' } = req.query as Record<string, string>;
    const startDate = getStartDate(period);
    const now = new Date();

    // B17 FIX: Use Order aggregation grouped by crop category instead of
    // CropListing's price*sold proxy. The old method conflated all-time 'sold'
    // counts with listings created in the period, producing wrong revenue figures.
    // This pipeline joins Orders (created in period) to their CropListing category.
    const breakdown = await Order.aggregate([
      { $match: { farmerId, createdAt: { $gte: startDate, $lte: now }, orderStatus: OrderStatus.Completed } },
      {
        $lookup: {
          from: 'croplistings',
          localField: 'cropId',
          foreignField: '_id',
          as: 'crop',
          pipeline: [{ $project: { category: 1, rating: 1 } }],
        },
      },
      { $unwind: { path: '$crop', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$crop.category',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalSold: { $sum: '$quantity' },
          avgRating: { $avg: '$crop.rating' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({ success: true, period, data: breakdown });
  } catch (error) {
    next(error);
  }
}

export async function getTopPerformingCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;
    const { limit = '10' } = req.query as Record<string, string>;
    const topCrops = await CropListing.find({ farmerId }).select('cropName category price rating sold views quantity').sort({ sold: -1, views: -1 }).limit(Number(limit)).lean();
    const result = topCrops.map((crop) => ({
      ...crop, revenue: crop.price * (crop.sold || 0),
      conversionRate: (crop.views ?? 0) > 0 ? (((crop.sold ?? 0) / (crop.views ?? 1)) * 100).toFixed(2) : 0,
      performanceScore: calculatePerformanceScore(crop, crop.sold || 0),
    }));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getExportTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const csvTemplate = `cropName,category,price,quantity,unit,description,discount
Example Tomato,Vegetables,50,100,kg,Fresh red tomatoes from farm,10
Example Carrot,Vegetables,30,200,kg,Organic carrots,5`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crop-upload-template.csv"');
    res.send(csvTemplate);
  } catch (error) {
    next(error);
  }
}

interface BulkUploadError {
  row: number;
  error: string;
}

export async function bulkUploadCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const farmerId = req.user!._id;

    if (!req.file) {
      sendError(res, 'No file uploaded', 400);
      return;
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      sendError(res, 'CSV must have headers and at least one data row', 400);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['cropname', 'category', 'price', 'quantity', 'description'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      sendError(res, `Missing required headers: ${missingHeaders.join(', ')}`, 400);
      return;
    }

    const crops: Record<string, unknown>[] = [];
    const errors: BulkUploadError[] = [];

    const user = await User.findById(farmerId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    for (let i = 1; i < Math.min(lines.length, 1001); i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length < requiredHeaders.length) {
        errors.push({ row: i + 1, error: 'Insufficient columns' });
        continue;
      }
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => { rowData[header] = values[index]; });

      if (!rowData.cropname || !rowData.category || !rowData.price || !rowData.quantity) {
        errors.push({ row: i + 1, error: 'Missing required fields' });
        continue;
      }
      if (isNaN(parseFloat(rowData.price)) || isNaN(parseInt(rowData.quantity))) {
        errors.push({ row: i + 1, error: 'Price and quantity must be numbers' });
        continue;
      }

      crops.push({
        farmerId,
        cropName: rowData.cropname,
        // Default to Vegetables if cropType not in CSV (schema requires it via enum)
        cropType: rowData.croptype || 'vegetables',
        category: rowData.category,
        price: parseFloat(rowData.price),
        quantity: parseInt(rowData.quantity, 10),  // B16 FIX: explicit radix 10
        description: rowData.description || 'No description provided',
        unit: rowData.unit || 'kg',
        discount: parseFloat(rowData.discount) || 0,
        // Fallback to user profile if missing from CSV (schema strictly requires these)
        pickupLocation: rowData.pickuplocation || user.address || 'Location not provided',
        contactNumber: rowData.contactnumber || user.phone || 'Phone not provided',
        status: 'active',
        listingApprovalStatus: 'pending',
      });
      if (crops.length >= 1000) break;
    }

    let insertedCount = 0;
    if (crops.length > 0) {
      const result = await CropListing.insertMany(crops, { ordered: false });
      insertedCount = result.length;
    }

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      summary: { total: lines.length - 1, inserted: insertedCount, failed: errors.length },
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    const err = error as { name?: string; message?: string };
    if (err.name === 'MongoBulkWriteError') {
      sendError(res, 'Some crops failed to insert. Please check your data for duplicates or invalid values.', 400);
      return;
    }
    next(error);
  }
}
