import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

/**
 * @route GET /api/farmer/dashboard/stats
 * @desc Get farmer dashboard overview statistics
 * @access Private (Farmer only)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    
    // Fetch all crops for this farmer
    const crops = await CropListing.find({ farmerId });
    
    // Fetch all orders where farmer is the seller
    const orders = await Order.find({ farmerId })
      .populate('cropId', 'price')
      .lean();
    
    // Calculate statistics
    const stats = {
      totalActiveListing: crops.filter(c => c.status === 'active').length,
      totalApprovedListing: crops.filter(c => c.listingApprovalStatus === 'approved').length,
      totalPendingListing: crops.filter(c => c.listingApprovalStatus === 'pending').length,
      totalRejectedListing: crops.filter(c => c.listingApprovalStatus === 'rejected').length,
      totalCrops: crops.length,
      
      // Revenue calculations
      totalRevenue: orders
        .filter(o => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum, order) => sum + (order.totalPrice || 0), 0),
      
      // Sales metrics
      totalOrdersReceived: orders.length,
      completedOrders: orders.filter(o => o.status === 'delivered' || o.status === 'completed').length,
      pendingOrders: orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      
      // Inventory
      totalInventory: crops.reduce((sum, crop) => sum + (crop.quantity || 0), 0),
      lowStockItems: crops.filter(c => c.quantity <= c.lowStockThreshold).length,
      soldOut: crops.filter(c => c.status === 'soldOut').length,
      
      // Average metrics
      averageRating: crops.length > 0
        ? (crops.reduce((sum, crop) => sum + (crop.rating || 0), 0) / crops.length).toFixed(2)
        : 0,
      
      totalUnitssSold: crops.reduce((sum, crop) => sum + (crop.sold || 0), 0),
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/farmer/analytics/crops
 * @desc Get detailed analytics for all farmer crops
 * @access Private (Farmer only)
 * @query period: 'week', 'month', 'year' (default: 'month')
 */
export const getCropAnalytics = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { period = 'month' } = req.query;
    
    // Determine date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Get all orders in the period for this farmer
    const orders = await Order.find({
      farmerId,
      createdAt: { $gte: startDate, $lte: now }
    })
      .populate('cropId', 'cropName category price')
      .lean();
    
    // Get all crops for this farmer
    const crops = await CropListing.find({ farmerId })
      .select('cropName category price rating totalReviews views sold quantity status')
      .lean();
    
    // Build analytics for each crop
    const analytics = crops.map(crop => {
      const cropOrders = orders.filter(o => o.cropId?._id?.toString() === crop._id.toString());
      
      const cropAnalytics = {
        cropId: crop._id,
        cropName: crop.cropName,
        category: crop.category,
        price: crop.price,
        rating: crop.rating,
        reviews: crop.totalReviews,
        views: crop.views,
        
        // Sales metrics
        unitsSold: crop.sold,
        ordersReceived: cropOrders.length,
        totalRevenue: cropOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
        avgOrderValue: cropOrders.length > 0 
          ? (cropOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0) / cropOrders.length).toFixed(2)
          : 0,
        
        // Conversion metrics
        conversionRate: crop.views > 0 
          ? ((crop.sold / crop.views) * 100).toFixed(2)
          : 0,
        
        // Inventory
        currentQuantity: crop.quantity,
        status: crop.status,
        
        // Performance score (0-100)
        performanceScore: calculatePerformanceScore(crop, cropOrders.length)
      };
      
      return cropAnalytics;
    });
    
    // Sort by revenue descending
    analytics.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    res.status(200).json({
      success: true,
      period,
      data: analytics,
      summary: {
        totalCrops: crops.length,
        totalRevenue: analytics.reduce((sum, a) => sum + a.totalRevenue, 0),
        totalOrders: orders.length,
        avgConversionRate: (analytics.reduce((sum, a) => sum + parseFloat(a.conversionRate), 0) / analytics.length).toFixed(2) || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/farmer/analytics/revenue
 * @desc Get revenue trends over time
 * @access Private (Farmer only)
 * @query period: 'week', 'month', 'year'
 */
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { period = 'month' } = req.query;
    
    // Determine date range
    const now = new Date();
    let startDate = new Date();
    let groupBy = '%Y-%m-%d'; // Daily grouping
    
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = '%Y-%m'; // Monthly grouping
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Aggregate orders by date
    const revenueData = await Order.aggregate([
      {
        $match: {
          farmerId: farmerId,
          createdAt: { $gte: startDate, $lte: now },
          status: { $in: ['delivered', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy,
              date: '$createdAt'
            }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          units: { $sum: '$quantity' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format data for chart
    const chartData = revenueData.map(item => ({
      date: item._id,
      revenue: item.revenue,
      orders: item.orders,
      units: item.units
    }));
    
    // Calculate totals
    const totals = {
      totalRevenue: chartData.reduce((sum, item) => sum + item.revenue, 0),
      totalOrders: chartData.reduce((sum, item) => sum + item.orders, 0),
      totalUnits: chartData.reduce((sum, item) => sum + item.units, 0),
      avgDailyRevenue: (chartData.reduce((sum, item) => sum + item.revenue, 0) / (chartData.length || 1)).toFixed(2)
    };
    
    res.status(200).json({
      success: true,
      period,
      data: chartData,
      totals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/farmer/inventory/low-stock
 * @desc Get crops with low stock
 * @access Private (Farmer only)
 */
export const getLowStockItems = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    
    const lowStockItems = await CropListing.find({
      farmerId,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    })
      .select('cropName category quantity lowStockThreshold price status')
      .sort({ quantity: 1 })
      .lean();
    
    // Check if low-stock notification already exists
    const existingNotifications = await Notification.findOne({
      userId: farmerId,
      type: 'inventory',
      read: false
    });
    
    // Create notification if needed
    if (lowStockItems.length > 0 && !existingNotifications) {
      await Notification.create({
        userId: farmerId,
        type: 'inventory',
        title: 'Low Stock Alert',
        message: `You have ${lowStockItems.length} crops with low inventory levels`,
        priority: 'high',
        data: { count: lowStockItems.length }
      });
    }
    
    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/farmer/inventory/update-threshold
 * @desc Update low stock threshold for a crop
 * @access Private (Farmer only)
 */
export const updateLowStockThreshold = async (req, res, next) => {
  try {
    const { cropId, threshold } = req.body;
    const farmerId = req.user._id;
    
    // Validate input
    if (!cropId || threshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'cropId and threshold are required'
      });
    }
    
    if (threshold < 0) {
      return res.status(400).json({
        success: false,
        message: 'Threshold cannot be negative'
      });
    }
    
    // Find and update crop (ensure farmer owns it)
    const crop = await CropListing.findByIdAndUpdate(
      { _id: cropId, farmerId },
      { lowStockThreshold: threshold },
      { new: true, runValidators: true }
    );
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found or unauthorized'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Low stock threshold updated successfully',
      data: crop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/farmer/crops/categories-breakdown
 * @desc Get sales breakdown by category
 * @access Private (Farmer only)
 */
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { period = 'month' } = req.query;
    
    // Determine date range
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    // Get breakdown by category
    const breakdown = await CropListing.aggregate([
      {
        $match: {
          farmerId: farmerId,
          createdAt: { $gte: startDate, $lte: now }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$price', '$sold'] } },
          totalSold: { $sum: '$sold' },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      period,
      data: breakdown
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/farmer/crops/top-performing
 * @desc Get top performing crops
 * @access Private (Farmer only)
 * @query limit: number (default: 10)
 */
export const getTopPerformingCrops = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    const { limit = 10 } = req.query;
    
    const topCrops = await CropListing.find({ farmerId })
      .select('cropName category price rating sold views quantity')
      .sort({ sold: -1, views: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Calculate performance metrics
    const result = topCrops.map(crop => ({
      ...crop,
      revenue: crop.price * crop.sold,
      conversionRate: crop.views > 0 ? ((crop.sold / crop.views) * 100).toFixed(2) : 0,
      performanceScore: calculatePerformanceScore(crop, crop.sold)
    }));
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function: Calculate performance score (0-100)
 */
function calculatePerformanceScore(crop, orderCount) {
  let score = 0;
  
  // Rating component (max 40 points)
  score += (crop.rating || 0) * 8; // 5 stars = 40 points
  
  // Conversion component (max 30 points)
  const conversionRate = crop.views > 0 ? (crop.sold / crop.views) : 0;
  score += Math.min(conversionRate * 100, 30); // 30% conversion = 30 points
  
  // Sales volume component (max 30 points)
  // Normalize to 100 sales = 30 points
  score += Math.min((crop.sold / 100) * 30, 30);
  
  return Math.min(Math.round(score), 100);
}

/**
 * @route POST /api/farmer/crops/bulk-upload
 * @desc Upload multiple crops from CSV
 * @access Private (Farmer only)
 * NOTE: Requires multer middleware to parse CSV file
 */
export const bulkUploadCrops = async (req, res, next) => {
  try {
    const farmerId = req.user._id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Parse CSV content
    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'CSV must have headers and at least one data row'
      });
    }
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['cropName', 'category', 'price', 'quantity', 'description'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }
    
    // Parse data rows
    const crops = [];
    const errors = [];
    
    for (let i = 1; i < Math.min(lines.length, 1001); i++) { // Limit to 1000 crops
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length < requiredHeaders.length) {
        errors.push({ row: i + 1, error: 'Insufficient columns' });
        continue;
      }
      
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });
      
      // Validate required fields
      if (!rowData.cropName || !rowData.category || !rowData.price || !rowData.quantity) {
        errors.push({ row: i + 1, error: 'Missing required fields' });
        continue;
      }
      
      // Validate price and quantity are numbers
      if (isNaN(parseFloat(rowData.price)) || isNaN(parseInt(rowData.quantity))) {
        errors.push({ row: i + 1, error: 'Price and quantity must be numbers' });
        continue;
      }
      
      crops.push({
        farmerId,
        cropName: rowData.cropName,
        category: rowData.category,
        price: parseFloat(rowData.price),
        quantity: parseInt(rowData.quantity),
        description: rowData.description || 'No description provided',
        unit: rowData.unit || 'kg',
        discount: parseFloat(rowData.discount) || 0,
        status: 'active',
        listingApprovalStatus: 'pending'
      });
      
      if (crops.length >= 1000) {
        break;
      }
    }
    
    // Insert crops in bulk
    let insertedCount = 0;
    if (crops.length > 0) {
      const result = await CropListing.insertMany(crops, { ordered: false });
      insertedCount = result.length;
    }
    
    res.status(200).json({
      success: true,
      message: `Bulk upload completed`,
      summary: {
        total: lines.length - 1,
        inserted: insertedCount,
        failed: errors.length
      },
      errors: errors.slice(0, 50) // Return first 50 errors
    });
  } catch (error) {
    if (error.name === 'MongoBulkWriteError') {
      // Handle duplicate key or validation errors
      return res.status(400).json({
        success: false,
        message: 'Some crops failed to insert. Please check your data for duplicates or invalid values.',
        error: error.message
      });
    }
    next(error);
  }
};

/**
 * @route GET /api/farmer/crops/export-template
 * @desc Download CSV template for bulk upload
 * @access Private (Farmer only)
 */
export const getExportTemplate = async (req, res, next) => {
  try {
    const csvTemplate = `cropName,category,price,quantity,unit,description,discount
Example Tomato,Vegetables,50,100,kg,Fresh red tomatoes from farm,10
Example Carrot,Vegetables,30,200,kg,Organic carrots,5
Example Apple,Fruits,80,150,kg,Sweet red apples,0`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="crop-upload-template.csv"');
    res.send(csvTemplate);
  } catch (error) {
    next(error);
  }
};
