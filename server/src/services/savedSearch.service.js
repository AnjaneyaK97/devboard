import { SavedSearch } from '../models/SavedSearch.js';
import { createNotification } from './notification.service.js';
import { emailService } from './email.service.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Save a search configuration with alert preferences
 */
export const createSavedSearch = async (userId, data) => {
  const count = await SavedSearch.countDocuments({ user: userId });
  if (count >= 15) {
    throw new AppError('You have reached the maximum limit of 15 saved searches', 400);
  }

  const savedSearch = await SavedSearch.create({
    user: userId,
    title: data.title || 'My Search Alert',
    criteria: {
      keyword: data.criteria?.keyword || '',
      location: data.criteria?.location || '',
      jobType: data.criteria?.jobType || '',
      experienceLevel: data.criteria?.experienceLevel || '',
      remote: typeof data.criteria?.remote === 'boolean' ? data.criteria.remote : null,
      salaryMin: Number(data.criteria?.salaryMin) || 0,
    },
    alertFrequency: data.alertFrequency || 'daily',
  });

  return savedSearch;
};

/**
 * Get all saved searches for a user
 */
export const getUserSavedSearches = async (userId) => {
  return SavedSearch.find({ user: userId }).sort({ createdAt: -1 }).lean();
};

/**
 * Delete a saved search
 */
export const deleteSavedSearch = async (searchId, userId) => {
  const search = await SavedSearch.findOneAndDelete({ _id: searchId, user: userId });
  if (!search) {
    throw new AppError('Saved search not found', 404);
  }
  return { success: true };
};

/**
 * Evaluate newly posted jobs against saved searches and trigger alerts
 */
export const evaluateAndNotifySavedSearches = async (job) => {
  try {
    const activeSearches = await SavedSearch.find({
      user: { $ne: job.postedBy },
      alertFrequency: { $in: ['immediate', 'daily'] },
    }).populate('user', 'name email isActive');

    const matchedUsers = new Set();

    for (const search of activeSearches) {
      if (!search.user || !search.user.isActive) continue;
      if (matchedUsers.has(search.user._id.toString())) continue; // Avoid duplicate alert per job posting

      const { criteria } = search;

      // 1. Keyword check
      if (criteria.keyword && criteria.keyword.trim()) {
        const kw = criteria.keyword.trim().toLowerCase();
        const inTitle = job.title && job.title.toLowerCase().includes(kw);
        const inDesc = job.description && job.description.toLowerCase().includes(kw);
        const inSkills = Array.isArray(job.skills) && job.skills.some((s) => s.toLowerCase().includes(kw));

        if (!inTitle && !inDesc && !inSkills) continue;
      }

      // 2. Location check
      if (criteria.location && criteria.location.trim()) {
        const loc = criteria.location.trim().toLowerCase();
        if (!job.location || !job.location.toLowerCase().includes(loc)) continue;
      }

      // 3. JobType check
      if (criteria.jobType && job.jobType !== criteria.jobType) {
        continue;
      }

      // 4. ExperienceLevel check
      if (criteria.experienceLevel && job.experienceLevel !== criteria.experienceLevel) {
        continue;
      }

      // 5. Remote check
      if (typeof criteria.remote === 'boolean' && job.remote !== criteria.remote) {
        continue;
      }

      // 6. Salary minimum check
      if (criteria.salaryMin && Number(criteria.salaryMin) > 0) {
        if (job.salaryMax < Number(criteria.salaryMin)) continue;
      }

      // Match found!
      matchedUsers.add(search.user._id.toString());

      // Create in-app notification
      await createNotification({
        user: search.user._id,
        type: 'job_alert',
        title: `Job Alert: ${job.title}`,
        message: `${job.company} posted a new role matching "${search.title}".`,
        link: `/jobs/${job._id}`,
        data: { jobId: job._id, searchId: search._id },
      });

      // Dispatch async transactional email
      emailService.sendJobAlertEmail(search.user, search.title, job);

      // Update search timestamp
      search.lastAlertSentAt = new Date();
      await search.save();
    }
  } catch (err) {
    logger.error('Error evaluating saved searches for new job:', err);
  }
};
