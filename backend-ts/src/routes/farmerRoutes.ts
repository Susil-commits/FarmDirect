import { Router } from 'express';
import multer from 'multer';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';
import {
  getDashboardStats, getCropAnalytics, getRevenueAnalytics, getLowStockItems,
  updateLowStockThreshold, getCategoryBreakdown, getTopPerformingCrops,
  bulkUploadCrops, getExportTemplate,
} from '../controllers/farmerController.js';

const router = Router();

// Configure multer for CSV uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.use(protect, authorize(UserRole.Farmer));

router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/crops', getCropAnalytics);
router.get('/analytics/revenue', getRevenueAnalytics);
router.get('/crops/categories-breakdown', getCategoryBreakdown);
router.get('/crops/top-performing', getTopPerformingCrops);
router.get('/inventory/low-stock', getLowStockItems);
router.post('/inventory/update-threshold', updateLowStockThreshold);
router.post('/crops/bulk-upload', upload.single('file'), bulkUploadCrops);
router.get('/crops/export-template', getExportTemplate);

export default router;
