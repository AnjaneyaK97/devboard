import { Job, Application, SavedJob, AuditLog } from '../models/index.js';
import { User } from '../models/User.js';
import { cacheService } from './cache.service.js';
import { calculateMatchScore } from './matching.service.js';
import { evaluateAndNotifySavedSearches } from './savedSearch.service.js';
import { AppError } from '../utils/AppError.js';
import { JOB_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';

/**
 * List jobs with text search, faceted filtering, pagination, and caching
 */
export const listJobs = async (queryParams) => {
  const {
    keyword,
    location,
    jobType,
    experienceLevel,
    remote,
    salaryMin,
    salaryMax,
    skills,
    sortBy = 'recent',
    page = 1,
    limit = 10,
  } = queryParams;

  // Build cache key based on query parameters
  const cacheKey = `jobs:list:${JSON.stringify(queryParams)}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // Construct MongoDB filter
  const filter = { status: JOB_STATUS.ACTIVE };

  // Text search with relevance scoring
  let projection = null;
  let sort = { createdAt: -1 };

  if (keyword && keyword.trim()) {
    filter.$text = { $search: keyword.trim() };
    projection = { score: { $meta: 'textScore' } };
  }

  if (location && location.trim()) {
    filter.location = { $regex: location.trim(), $options: 'i' };
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (experienceLevel) {
    filter.experienceLevel = experienceLevel;
  }

  if (typeof remote === 'boolean') {
    filter.remote = remote;
  }

  if (salaryMin !== undefined && !isNaN(salaryMin)) {
    filter.salaryMax = { $gte: salaryMin };
  }

  if (salaryMax !== undefined && !isNaN(salaryMax)) {
    filter.salaryMin = { $lte: salaryMax };
  }

  if (skills && skills.trim()) {
    const skillsList = skills
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (skillsList.length > 0) {
      filter.skills = { $in: skillsList };
    }
  }

  // Determine sorting
  if (sortBy === 'relevance' && filter.$text) {
    sort = { score: { $meta: 'textScore' } };
  } else if (sortBy === 'salary') {
    sort = { salaryMax: -1, salaryMin: -1 };
  } else if (sortBy === 'views') {
    sort = { views: -1 };
  } else {
    sort = { createdAt: -1 };
  }

  const skip = (page - 1) * limit;

  // Execute query and total count in parallel
  const [jobs, totalJobs] = await Promise.all([
    Job.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title company location jobType experienceLevel salaryMin salaryMax skills remote status views applicationsCount createdAt')
      .populate('postedBy', 'name companyName companyLogo')
      .lean(),
    Job.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalJobs / limit) || 1;

  const result = {
    jobs,
    pagination: {
      total: totalJobs,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  // Cache for 2 minutes
  await cacheService.set(cacheKey, result, 120);

  return result;
};

/**
 * Retrieve single job detail by ID with applicant/saved context
 */
export const getJobById = async (jobId, currentUserId = null) => {
  const job = await Job.findById(jobId)
    .populate('postedBy', 'name companyName companyLogo companyWebsite bio location')
    .lean();

  if (!job) {
    throw new AppError('Job not found', 404);
  }

  let hasApplied = false;
  let isSaved = false;

  if (currentUserId) {
    const [existingApplication, existingSaved] = await Promise.all([
      Application.findOne({ job: jobId, applicant: currentUserId }).select('_id status createdAt').lean(),
      SavedJob.findOne({ job: jobId, user: currentUserId }).select('_id').lean(),
    ]);

    hasApplied = Boolean(existingApplication);
    isSaved = Boolean(existingSaved);

    job.userApplication = existingApplication || null;
  }

  job.hasApplied = hasApplied;
  job.isSaved = isSaved;

  return job;
};

/**
 * Create a new job listing (Employer / Admin only)
 */
export const createJob = async (employerId, jobData, meta = {}) => {
  // Normalize skills to lowercase
  if (Array.isArray(jobData.skills)) {
    jobData.skills = jobData.skills.map((s) => s.trim().toLowerCase());
  }

  const job = await Job.create({
    ...jobData,
    postedBy: employerId,
  });

  // Invalidate job list caches
  await cacheService.invalidatePrefix('jobs:');

  // Audit Log
  await AuditLog.create({
    actor: employerId,
    action: 'JOB_CREATED',
    entity: 'Job',
    entityId: job._id,
    meta: { title: job.title, company: job.company },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  // Evaluate matching saved searches asynchronously
  setImmediate(() => {
    evaluateAndNotifySavedSearches(job).catch(() => {});
  });

  return job;
};

/**
 * Update an existing job (Owner-restricted or Admin)
 */
export const updateJob = async (userId, userRole, jobId, updateData, meta = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  // Authorization check: Owner or Admin
  if (userRole !== ROLES.ADMIN && job.postedBy.toString() !== userId.toString()) {
    throw new AppError('Forbidden: You can only update jobs posted by your organization', 403);
  }

  if (Array.isArray(updateData.skills)) {
    updateData.skills = updateData.skills.map((s) => s.trim().toLowerCase());
  }

  Object.assign(job, updateData);
  await job.save();

  // Invalidate caches
  await cacheService.invalidatePrefix('jobs:');

  // Audit Log
  await AuditLog.create({
    actor: userId,
    action: 'JOB_UPDATED',
    entity: 'Job',
    entityId: job._id,
    meta: { updatedFields: Object.keys(updateData) },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return job;
};

/**
 * Delete a job (Owner-restricted or Admin)
 */
export const deleteJob = async (userId, userRole, jobId, meta = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (userRole !== ROLES.ADMIN && job.postedBy.toString() !== userId.toString()) {
    throw new AppError('Forbidden: You can only delete jobs posted by your organization', 403);
  }

  await Job.findByIdAndDelete(jobId);

  // Invalidate caches
  await cacheService.invalidatePrefix('jobs:');

  // Audit Log
  await AuditLog.create({
    actor: userId,
    action: 'JOB_DELETED',
    entity: 'Job',
    entityId: jobId,
    meta: { title: job.title },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return { message: 'Job deleted successfully' };
};

/**
 * Get jobs posted by the logged-in employer
 */
export const getEmployerJobs = async (employerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find({ postedBy: employerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments({ postedBy: employerId }),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Increment view count for a job listing
 */
export const incrementJobViews = async (jobId) => {
  const job = await Job.findByIdAndUpdate(jobId, { $inc: { views: 1 } }, { new: true }).select('views');
  if (!job) {
    throw new AppError('Job not found', 404);
  }
  return job.views;
};

/**
 * Get personalized recommended jobs for an authenticated seeker
 */
export const getRecommendedJobs = async (userId, limit = 10) => {
  const user = await User.findById(userId).select('skills experienceYears').lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Get active jobs
  const jobs = await Job.find({ status: JOB_STATUS.ACTIVE })
    .select('title company location jobType experienceLevel salaryMin salaryMax skills remote status views createdAt')
    .populate('postedBy', 'name companyName companyLogo')
    .lean();

  // Score each job with Smart Match algorithm
  const scoredJobs = jobs.map((job) => {
    const match = calculateMatchScore(user, job);
    return {
      ...job,
      matchScore: match.matchScore,
      skillScore: match.skillScore,
      experienceScore: match.experienceScore,
      matchedSkills: match.matchedSkills,
    };
  });

  // Sort descending by matchScore
  scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

  return scoredJobs.slice(0, limit);
};
