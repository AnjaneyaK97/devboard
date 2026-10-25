import express from 'express';
import {
  getAllJobs,
  getJobDetail,
  create,
  update,
  remove,
  getMyJobs,
  trackView,
  getRecommended,
} from '../controllers/job.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';
import { restrictTo } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
} from '../validations/job.validation.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', validate(jobQuerySchema, 'query'), getAllJobs);
router.get('/recommended', protect, restrictTo(ROLES.SEEKER, ROLES.ADMIN), getRecommended);
router.get('/my/listings', protect, restrictTo(ROLES.EMPLOYER, ROLES.ADMIN), getMyJobs);
router.get('/:id', optionalAuth, getJobDetail);
router.post('/', protect, restrictTo(ROLES.EMPLOYER, ROLES.ADMIN), validate(createJobSchema), create);
router.put('/:id', protect, restrictTo(ROLES.EMPLOYER, ROLES.ADMIN), validate(updateJobSchema), update);
router.delete('/:id', protect, restrictTo(ROLES.EMPLOYER, ROLES.ADMIN), remove);
router.post('/:id/view', trackView);

export default router;
