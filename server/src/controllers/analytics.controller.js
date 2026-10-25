import { asyncWrapper } from '../utils/asyncWrapper.js';
import * as analyticsService from '../services/analytics.service.js';

/**
 * GET /api/v1/analytics/employer/summary
 */
export const getEmployerSummary = asyncWrapper(async (req, res) => {
  const data = await analyticsService.getEmployerSummary(req.user._id);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /api/v1/analytics/employer/funnel
 */
export const getEmployerFunnel = asyncWrapper(async (req, res) => {
  const { jobId } = req.query;
  const data = await analyticsService.getEmployerFunnel(req.user._id, jobId);
  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /api/v1/analytics/employer/time-to-hire
 */
export const getTimeToHire = asyncWrapper(async (req, res) => {
  const { jobId } = req.query;
  const data = await analyticsService.getTimeToHire(req.user._id, jobId);
  res.status(200).json({
    success: true,
    data,
  });
});
