import express from 'express';
import {
  getEmployerSummary,
  getEmployerFunnel,
  getTimeToHire,
} from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo(ROLES.EMPLOYER, ROLES.ADMIN));

router.get('/employer/summary', getEmployerSummary);
router.get('/employer/funnel', getEmployerFunnel);
router.get('/employer/time-to-hire', getTimeToHire);

export default router;
