import express from 'express';
import {
  submitContactQuery,
  getAllContactQueries,
  getContactQuery,
  updateContactQuery,
  deleteContactQuery,
  searchContactQueries,
  getContactQueryStats,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/submit', submitContactQuery);

// Admin only routes
router.use(protect); // All routes below require authentication
router.use(authorize('admin')); // All routes below require Admin role

router.get('/', getAllContactQueries);
router.get('/stats', getContactQueryStats);
router.get('/search', searchContactQueries);
router.get('/:id', getContactQuery);
router.patch('/:id', updateContactQuery);
router.delete('/:id', deleteContactQuery);

export default router;
