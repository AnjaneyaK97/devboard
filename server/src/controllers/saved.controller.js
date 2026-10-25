import { saveJob, unsaveJob, getSavedJobs } from '../services/saved.service.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';

export const bookmark = asyncWrapper(async (req, res) => {
  const { jobId, notes } = req.body;
  const saved = await saveJob(req.user._id, jobId, notes);

  res.status(200).json({
    success: true,
    message: 'Job bookmarked successfully',
    data: { saved },
    requestId: req.requestId,
  });
});

export const unbookmark = asyncWrapper(async (req, res) => {
  const { jobId } = req.params;
  const result = await unsaveJob(req.user._id, jobId);

  res.status(200).json({
    success: true,
    message: result.message,
    requestId: req.requestId,
  });
});

export const listSaved = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const result = await getSavedJobs(req.user._id, page, limit);

  res.status(200).json({
    success: true,
    data: result.savedJobs,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});
