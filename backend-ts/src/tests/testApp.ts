import express from 'express';
import authRoutes from '../routes/authRoutes.js';
import cropRoutes from '../routes/cropRoutes.js';
import errorHandler from '../middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use(errorHandler);

export default app;
