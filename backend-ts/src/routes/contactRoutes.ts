import { Router } from 'express';
import {
  submitContactQuery, getAllContactQueries, getContactQuery, updateContactQuery,
  deleteContactQuery, searchContactQueries, getContactQueryStats,
} from '../controllers/contactController.js';
import { protect, authorize } from '../middleware/auth.js';
import { UserRole } from '../types/enums.js';
import validateRequest, { validateObjectId } from '../middleware/validator.js';
import { submitContactSchema, updateContactQuerySchema } from '../schemas/contactSchemas.js';

const router = Router();

router.post('/submit', validateRequest({ body: submitContactSchema }), submitContactQuery);

router.use(protect);
router.use(authorize(UserRole.Admin));

router.get('/', getAllContactQueries);
router.get('/stats', getContactQueryStats);
router.get('/search', searchContactQueries);
router.get('/:id', validateObjectId('id'), getContactQuery);
router.patch('/:id', validateObjectId('id'), validateRequest({ body: updateContactQuerySchema }), updateContactQuery);
router.delete('/:id', validateObjectId('id'), deleteContactQuery);

export default router;
