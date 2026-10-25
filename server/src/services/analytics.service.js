import mongoose from 'mongoose';
import { Job, Application } from '../models/index.js';
import { APPLICATION_STATUS } from '../constants/status.js';

/**
 * Employer high-level metrics & per-job conversion performance
 */
export const getEmployerSummary = async (employerId) => {
  const matchEmployer = { postedBy: new mongoose.Types.ObjectId(employerId.toString()) };

  const [stats] = await Job.aggregate([
    { $match: matchEmployer },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        activeJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        closedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] },
        },
        totalViews: { $sum: '$views' },
        totalApplications: { $sum: '$applicationsCount' },
      },
    },
  ]);

  const jobPerformance = await Job.aggregate([
    { $match: matchEmployer },
    {
      $project: {
        title: 1,
        company: 1,
        status: 1,
        views: 1,
        applicationsCount: 1,
        createdAt: 1,
        conversionRate: {
          $cond: [
            { $gt: ['$views', 0] },
            { $round: [{ $multiply: [{ $divide: ['$applicationsCount', '$views'] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  const summary = stats || {
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalViews: 0,
    totalApplications: 0,
  };

  const overallConversionRate =
    summary.totalViews > 0
      ? Math.round((summary.totalApplications / summary.totalViews) * 1000) / 10
      : 0;

  return {
    overview: {
      ...summary,
      overallConversionRate,
    },
    jobPerformance,
  };
};

/**
 * Aggregation pipeline for candidate hiring funnel stages
 */
export const getEmployerFunnel = async (employerId, jobId = null) => {
  let jobFilter = { postedBy: new mongoose.Types.ObjectId(employerId.toString()) };
  if (jobId) {
    jobFilter._id = new mongoose.Types.ObjectId(jobId.toString());
  }

  // Get relevant jobs
  const employerJobs = await Job.find(jobFilter).select('_id title').lean();
  if (employerJobs.length === 0) {
    return {
      funnel: [
        { stage: 'Applied', count: 0, conversionRate: 100 },
        { stage: 'Under Review', count: 0, conversionRate: 0 },
        { stage: 'Shortlisted', count: 0, conversionRate: 0 },
        { stage: 'Interview', count: 0, conversionRate: 0 },
        { stage: 'Offered', count: 0, conversionRate: 0 },
        { stage: 'Hired', count: 0, conversionRate: 0 },
      ],
      currentStatusDistribution: {},
      totalApplications: 0,
    };
  }

  const jobIds = employerJobs.map((j) => j._id);

  // Group by current status
  const currentStatusAggregation = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const currentStatusDistribution = Object.values(APPLICATION_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  let totalApplications = 0;
  currentStatusAggregation.forEach((item) => {
    currentStatusDistribution[item._id] = item.count;
    totalApplications += item.count;
  });

  // Calculate cumulative stage visit counts from statusHistory
  const stageVisitAggregation = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $unwind: '$statusHistory' },
    {
      $group: {
        _id: {
          applicationId: '$_id',
          status: '$statusHistory.status',
        },
      },
    },
    {
      $group: {
        _id: '$_id.status',
        uniqueApplications: { $sum: 1 },
      },
    },
  ]);

  const stageCounts = {
    applied: totalApplications,
    under_review: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    hired: 0,
  };

  stageVisitAggregation.forEach((s) => {
    if (stageCounts[s._id] !== undefined) {
      stageCounts[s._id] = s.uniqueApplications;
    }
  });

  // Enforce monotonicity for funnel visualization
  const appliedCount = totalApplications;
  const underReviewCount = Math.max(stageCounts.under_review, stageCounts.shortlisted, stageCounts.interview, stageCounts.offered, stageCounts.hired);
  const shortlistedCount = Math.max(stageCounts.shortlisted, stageCounts.interview, stageCounts.offered, stageCounts.hired);
  const interviewCount = Math.max(stageCounts.interview, stageCounts.offered, stageCounts.hired);
  const offeredCount = Math.max(stageCounts.offered, stageCounts.hired);
  const hiredCount = stageCounts.hired;

  const funnel = [
    {
      stage: 'Applied',
      count: appliedCount,
      conversionRate: 100,
      dropoff: appliedCount > 0 ? Math.round(((appliedCount - underReviewCount) / appliedCount) * 100) : 0,
    },
    {
      stage: 'Under Review',
      count: underReviewCount,
      conversionRate: appliedCount > 0 ? Math.round((underReviewCount / appliedCount) * 100) : 0,
      dropoff: underReviewCount > 0 ? Math.round(((underReviewCount - shortlistedCount) / underReviewCount) * 100) : 0,
    },
    {
      stage: 'Shortlisted',
      count: shortlistedCount,
      conversionRate: appliedCount > 0 ? Math.round((shortlistedCount / appliedCount) * 100) : 0,
      dropoff: shortlistedCount > 0 ? Math.round(((shortlistedCount - interviewCount) / shortlistedCount) * 100) : 0,
    },
    {
      stage: 'Interview',
      count: interviewCount,
      conversionRate: appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0,
      dropoff: interviewCount > 0 ? Math.round(((interviewCount - offeredCount) / interviewCount) * 100) : 0,
    },
    {
      stage: 'Offered',
      count: offeredCount,
      conversionRate: appliedCount > 0 ? Math.round((offeredCount / appliedCount) * 100) : 0,
      dropoff: offeredCount > 0 ? Math.round(((offeredCount - hiredCount) / offeredCount) * 100) : 0,
    },
    {
      stage: 'Hired',
      count: hiredCount,
      conversionRate: appliedCount > 0 ? Math.round((hiredCount / appliedCount) * 100) : 0,
      dropoff: 0,
    },
  ];

  return {
    funnel,
    currentStatusDistribution,
    totalApplications,
  };
};

/**
 * Compute Time-to-Hire metrics using MongoDB Aggregation
 */
export const getTimeToHire = async (employerId, jobId = null) => {
  let jobFilter = { postedBy: new mongoose.Types.ObjectId(employerId.toString()) };
  if (jobId) {
    jobFilter._id = new mongoose.Types.ObjectId(jobId.toString());
  }

  const employerJobs = await Job.find(jobFilter).select('_id title').lean();
  if (employerJobs.length === 0) {
    return {
      avgDaysToHire: 0,
      minDaysToHire: 0,
      maxDaysToHire: 0,
      totalHires: 0,
      recentHires: [],
    };
  }

  const jobIds = employerJobs.map((j) => j._id);

  const hiredApplications = await Application.aggregate([
    {
      $match: {
        job: { $in: jobIds },
        status: APPLICATION_STATUS.HIRED,
      },
    },
    {
      $addFields: {
        hiredEntry: {
          $filter: {
            input: '$statusHistory',
            as: 'history',
            cond: { $eq: ['$$history.status', APPLICATION_STATUS.HIRED] },
          },
        },
      },
    },
    {
      $project: {
        job: 1,
        applicant: 1,
        createdAt: 1,
        hiredAt: { $arrayElemAt: ['$hiredEntry.at', -1] },
        daysToHire: {
          $divide: [
            {
              $subtract: [
                { $ifNull: [{ $arrayElemAt: ['$hiredEntry.at', -1] }, '$updatedAt'] },
                '$createdAt',
              ],
            },
            1000 * 60 * 60 * 24, // Convert ms to days
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'applicant',
        foreignField: '_id',
        as: 'applicantDetails',
      },
    },
    {
      $lookup: {
        from: 'jobs',
        localField: 'job',
        foreignField: '_id',
        as: 'jobDetails',
      },
    },
    {
      $project: {
        daysToHire: { $round: ['$daysToHire', 1] },
        hiredAt: 1,
        createdAt: 1,
        applicantName: { $arrayElemAt: ['$applicantDetails.name', 0] },
        jobTitle: { $arrayElemAt: ['$jobDetails.title', 0] },
      },
    },
    { $sort: { hiredAt: -1 } },
  ]);

  if (hiredApplications.length === 0) {
    return {
      avgDaysToHire: 0,
      minDaysToHire: 0,
      maxDaysToHire: 0,
      totalHires: 0,
      recentHires: [],
    };
  }

  const daysList = hiredApplications.map((h) => h.daysToHire);
  const sum = daysList.reduce((acc, d) => acc + d, 0);
  const avgDaysToHire = Math.round((sum / daysList.length) * 10) / 10;
  const minDaysToHire = Math.min(...daysList);
  const maxDaysToHire = Math.max(...daysList);

  return {
    avgDaysToHire,
    minDaysToHire,
    maxDaysToHire,
    totalHires: hiredApplications.length,
    recentHires: hiredApplications.slice(0, 10),
  };
};
