import {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
  incrementJobViews,
  getRecommendedJobs,
} from '../services/job.service.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

/**
 * List all active jobs with search, filtering, and pagination
 * GET /api/v1/jobs
 */
export const getAllJobs = asyncWrapper(async (req, res) => {
  const result = await listJobs(req.query);

  res.status(200).json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Get job detail by ID
 * GET /api/v1/jobs/:id
 */
export const getJobDetail = asyncWrapper(async (req, res) => {
  const currentUserId = req.user ? req.user._id : null;
  const job = await getJobById(req.params.id, currentUserId);

  res.status(200).json({
    success: true,
    data: { job },
    requestId: req.requestId,
  });
});

/**
 * Create a new job listing (Employer / Admin)
 * POST /api/v1/jobs
 */
export const create = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const job = await createJob(req.user._id, req.body, meta);

  res.status(201).json({
    success: true,
    message: 'Job listing published successfully',
    data: { job },
    requestId: req.requestId,
  });
});

/**
 * Update a job listing (Owner-restricted or Admin)
 * PUT /api/v1/jobs/:id
 */
export const update = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const job = await updateJob(req.user._id, req.user.role, req.params.id, req.body, meta);

  res.status(200).json({
    success: true,
    message: 'Job listing updated successfully',
    data: { job },
    requestId: req.requestId,
  });
});

/**
 * Delete a job listing (Owner-restricted or Admin)
 * DELETE /api/v1/jobs/:id
 */
export const remove = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const result = await deleteJob(req.user._id, req.user.role, req.params.id, meta);

  res.status(200).json({
    success: true,
    message: result.message,
    requestId: req.requestId,
  });
});

/**
 * Get employer's own posted jobs
 * GET /api/v1/jobs/my/listings
 */
export const getMyJobs = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await getEmployerJobs(req.user._id, page, limit);

  res.status(200).json({
    success: true,
    data: result.jobs,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Increment view count for job
 * POST /api/v1/jobs/:id/view
 */
export const trackView = asyncWrapper(async (req, res) => {
  const views = await incrementJobViews(req.params.id);

  res.status(200).json({
    success: true,
    data: { views },
    requestId: req.requestId,
  });
});

/**
 * Get recommended jobs for authenticated seeker
 * GET /api/v1/jobs/recommended
 */
export const getRecommended = asyncWrapper(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const jobs = await getRecommendedJobs(req.user._id, limit);

  res.status(200).json({
    success: true,
    data: jobs,
    requestId: req.requestId,
  });
});
