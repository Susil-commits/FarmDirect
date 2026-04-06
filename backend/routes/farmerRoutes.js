import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDashboardStats,
  getCropAnalytics,
  getRevenueAnalytics,
  getLowStockItems,
  updateLowStockThreshold,
  getCategoryBreakdown,
  getTopPerformingCrops,
  bulkUploadCrops,
  getExportTemplate
} from '../controllers/farmerController.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// All routes require authentication and farmer role
router.use(protect);
router.use(authorize('farmer'));

// Dashboard & Analytics endpoints
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/crops', getCropAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/crops/categories-breakdown', getCategoryBreakdown);
router.get('/crops/top-performing', getTopPerformingCrops);

// Inventory Management
router.get('/inventory/low-stock', getLowStockItems);
router.post('/inventory/update-threshold', updateLowStockThreshold);

// Bulk Operations
router.post('/crops/bulk-upload', upload.single('file'), bulkUploadCrops);
router.get('/crops/export-template', getExportTemplate);

export default router;
