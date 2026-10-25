import express from 'express';
import {
  apply,
  getMyApplications,
  getJobApplicants,
  getDetail,
  updateStatus,
  withdraw,
} from '../controllers/application.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  applyJobSchema,
  updateApplicationStatusSchema,
  withdrawApplicationSchema,
} from '../validations/application.validation.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.post('/', protect, restrictTo(ROLES.SEEKER, ROLES.ADMIN), validate(applyJobSchema), apply);
router.get('/my', protect, restrictTo(ROLES.SEEKER, ROLES.ADMIN), getMyApplications);
router.get('/job/:jobId', protect, restrictTo(ROLES.EMPLOYER, ROLES.ADMIN), getJobApplicants);
router.get('/:id', protect, getDetail);
router.patch(
  '/:id/status',
  protect,
  restrictTo(ROLES.EMPLOYER, ROLES.ADMIN),
  validate(updateApplicationStatusSchema),
  updateStatus
);
router.patch(
  '/:id/withdraw',
  protect,
  restrictTo(ROLES.SEEKER, ROLES.ADMIN),
  validate(withdrawApplicationSchema),
  withdraw
);

export default router;
