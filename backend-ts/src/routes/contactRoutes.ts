import { Router } from 'express';
import {
  submitContactQuery, getAllContactQueries, getContactQuery, updateContactQuery,
  deleteContactQuery, searchContactQueries, getContactQueryStats,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';

const router = Router();

router.post('/submit', submitContactQuery);

router.use(protect);
router.use(authorize(UserRole.Admin));

router.get('/', getAllContactQueries);
router.get('/stats', getContactQueryStats);
router.get('/search', searchContactQueries);
router.get('/:id', getContactQuery);
router.patch('/:id', updateContactQuery);
router.delete('/:id', deleteContactQuery);

export default router;
