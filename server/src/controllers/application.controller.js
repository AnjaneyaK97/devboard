import {
  applyToJob,
  getSeekerApplications,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
} from '../services/application.service.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

/**
 * Submit job application
 * POST /api/v1/applications
 */
export const apply = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const application = await applyToJob(req.user._id, req.body, meta);

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application },
    requestId: req.requestId,
  });
});

/**
 * Get applications submitted by logged-in seeker
 * GET /api/v1/applications/my
 */
export const getMyApplications = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await getSeekerApplications(req.user._id, page, limit);

  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Get applicants for a specific job (Employer owner or Admin)
 * GET /api/v1/applications/job/:jobId
 */
export const getJobApplicants = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const statusFilter = req.query.status || null;

  const result = await getJobApplications(
    req.user._id,
    req.user.role,
    req.params.jobId,
    page,
    limit,
    statusFilter
  );

  res.status(200).json({
    success: true,
    data: result.applications,
    job: result.job,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Get single application detail by ID
 * GET /api/v1/applications/:id
 */
export const getDetail = asyncWrapper(async (req, res) => {
  const application = await getApplicationById(req.user._id, req.user.role, req.params.id);

  res.status(200).json({
    success: true,
    data: { application },
    requestId: req.requestId,
  });
});

/**
 * Update application status (Employer / Admin)
 * PATCH /api/v1/applications/:id/status
 */
export const updateStatus = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const application = await updateApplicationStatus(
    req.user._id,
    req.user.role,
    req.params.id,
    req.body.status,
    req.body.note,
    meta
  );

  res.status(200).json({
    success: true,
    message: `Application moved to ${req.body.status}`,
    data: { application },
    requestId: req.requestId,
  });
});

/**
 * Withdraw application (Seeker only)
 * PATCH /api/v1/applications/:id/withdraw
 */
export const withdraw = asyncWrapper(async (req, res) => {
  const meta = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  const application = await withdrawApplication(
    req.user._id,
    req.params.id,
    req.body.note,
    meta
  );

  res.status(200).json({
    success: true,
    message: 'Application withdrawn successfully',
    data: { application },
    requestId: req.requestId,
  });
});
