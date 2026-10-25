import { SavedJob, Job } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export const saveJob = async (userId, jobId, notes = '') => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  const existing = await SavedJob.findOne({ user: userId, job: jobId });
  if (existing) {
    existing.notes = notes;
    await existing.save();
    return existing;
  }

  const saved = await SavedJob.create({
    user: userId,
    job: jobId,
    notes,
  });

  return saved;
};

export const unsaveJob = async (userId, jobId) => {
  await SavedJob.findOneAndDelete({ user: userId, job: jobId });
  return { message: 'Job removed from saved' };
};

export const getSavedJobs = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [savedJobs, total] = await Promise.all([
    SavedJob.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'job',
        select: 'title company location jobType salaryMin salaryMax remote skills status createdAt',
        populate: { path: 'postedBy', select: 'name companyName companyLogo' },
      })
      .lean(),
    SavedJob.countDocuments({ user: userId }),
  ]);

  return {
    savedJobs: savedJobs.filter((sj) => sj.job !== null), // filter out any deleted jobs
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
