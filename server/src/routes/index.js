import express from 'express';
import authRoutes from './auth.routes.js';
import jobRoutes from './job.routes.js';
import applicationRoutes from './application.routes.js';
import savedRoutes from './saved.routes.js';
import uploadRoutes from './upload.routes.js';
import notificationRoutes from './notification.routes.js';
import savedSearchRoutes from './savedSearch.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/saved', savedRoutes);
router.use('/uploads', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/saved-searches', savedSearchRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
