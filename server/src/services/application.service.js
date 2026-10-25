import { Application, Job, User, AuditLog } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { APPLICATION_STATUS, JOB_STATUS } from '../constants/status.js';
import { ROLES } from '../constants/roles.js';
import { createNotification } from './notification.service.js';
import { emailService } from './email.service.js';
import { emitToUser } from './socket.service.js';
import { logger } from '../utils/logger.js';

/**
 * Submit an application to an active job listing
 */
export const applyToJob = async (applicantId, applicationData, meta = {}) => {
  const { jobId, resumeUrl, resumeOriginalName, coverNote } = applicationData;

  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (job.status !== JOB_STATUS.ACTIVE) {
    throw new AppError('This job is no longer accepting applications', 400);
  }

  // Prevent employer from applying to their own job
  if (job.postedBy.toString() === applicantId.toString()) {
    throw new AppError('You cannot apply to a job posted by your own organization', 400);
  }

  // Duplicate application prevention
  const existingApp = await Application.findOne({ job: jobId, applicant: applicantId });
  if (existingApp) {
    throw new AppError('You have already applied for this position', 409);
  }

  // Compute skill overlap match score
  let matchScore = 50; // default baseline
  const applicant = await User.findById(applicantId).select('skills experienceYears').lean();
  if (applicant && job.skills && job.skills.length > 0) {
    const seekerSkills = new Set(applicant.skills || []);
    const matched = job.skills.filter((skill) => seekerSkills.has(skill.toLowerCase()));
    matchScore = Math.round((matched.length / job.skills.length) * 100);
  }

  const application = await Application.create({
    job: jobId,
    applicant: applicantId,
    resumeUrl,
    resumeOriginalName: resumeOriginalName || 'resume.pdf',
    coverNote: coverNote || '',
    status: APPLICATION_STATUS.APPLIED,
    matchScore,
    statusHistory: [
      {
        status: APPLICATION_STATUS.APPLIED,
        changedBy: applicantId,
        note: 'Application submitted',
        at: new Date(),
      },
    ],
  });

  // Increment applications count on job atomically
  await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

  // Audit Log
  await AuditLog.create({
    actor: applicantId,
    action: 'APPLICATION_SUBMITTED',
    entity: 'Application',
    entityId: application._id,
    meta: { jobId: job._id, jobTitle: job.title },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  // Async notifications and emails
  try {
    const [applicantUser, employerUser] = await Promise.all([
      User.findById(applicantId).select('name email').lean(),
      User.findById(job.postedBy).select('name email').lean(),
    ]);

    // 1. Notify Applicant
    if (applicantUser) {
      await createNotification({
        user: applicantId,
        type: 'application_received',
        title: 'Application Submitted',
        message: `Your application for "${job.title}" at ${job.company} was submitted successfully.`,
        link: '/dashboard/seeker',
        data: { applicationId: application._id, jobId: job._id },
      });
      emailService.sendApplicationSubmittedEmail(applicantUser, job);
    }

    // 2. Notify Employer & emit socket event
    if (employerUser) {
      await createNotification({
        user: job.postedBy,
        type: 'application_received',
        title: `New Candidate: ${applicantUser?.name || 'Applicant'}`,
        message: `${applicantUser?.name || 'A candidate'} applied for "${job.title}".`,
        link: `/dashboard/employer?job=${job._id}`,
        data: { applicationId: application._id, jobId: job._id },
      });
      emitToUser(job.postedBy, 'application:new', {
        applicationId: application._id,
        jobId: job._id,
        jobTitle: job.title,
        applicant: applicantUser,
        matchScore: application.matchScore,
      });
      emailService.sendApplicationReceivedEmployerEmail(employerUser, applicantUser, job, application._id);
    }
  } catch (err) {
    logger.warn(`Failed to dispatch application notifications: ${err.message}`);
  }

  return application;
};

/**
 * Get all applications submitted by the logged-in seeker
 */
export const getSeekerApplications = async (applicantId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find({ applicant: applicantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('job', 'title company location jobType salaryMin salaryMax status remote')
      .lean(),
    Application.countDocuments({ applicant: applicantId }),
  ]);

  return {
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get all applications for a specific job (Owner-restricted or Admin)
 */
export const getJobApplications = async (
  employerId,
  userRole,
  jobId,
  page = 1,
  limit = 20,
  statusFilter = null
) => {
  const job = await Job.findById(jobId).select('postedBy title company');
  if (!job) {
    throw new AppError('Job not found', 404);
  }

  if (userRole !== ROLES.ADMIN && job.postedBy.toString() !== employerId.toString()) {
    throw new AppError('Forbidden: You can only view applicants for your own job listings', 403);
  }

  const query = { job: jobId };
  if (statusFilter && Object.values(APPLICATION_STATUS).includes(statusFilter)) {
    query.status = statusFilter;
  }

  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    Application.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('applicant', 'name email skills experienceYears location bio')
      .lean(),
    Application.countDocuments(query),
  ]);

  return {
    job: { _id: job._id, title: job.title, company: job.company },
    applications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Get single application by ID with permission enforcement
 */
export const getApplicationById = async (userId, userRole, applicationId) => {
  const application = await Application.findById(applicationId)
    .populate('job', 'title company location postedBy jobType salaryMin salaryMax status')
    .populate('applicant', 'name email skills experienceYears location bio')
    .populate('statusHistory.changedBy', 'name role')
    .lean();

  if (!application) {
    throw new AppError('Application not found', 404);
  }

  const isApplicant = application.applicant._id.toString() === userId.toString();
  const isJobEmployer = application.job && application.job.postedBy.toString() === userId.toString();
  const isAdmin = userRole === ROLES.ADMIN;

  if (!isApplicant && !isJobEmployer && !isAdmin) {
    throw new AppError('Forbidden: You do not have permission to view this application', 403);
  }

  return application;
};

/**
 * Update application status with timeline logging (Employer / Admin)
 */
export const updateApplicationStatus = async (
  employerId,
  userRole,
  applicationId,
  newStatus,
  note = '',
  meta = {}
) => {
  const application = await Application.findById(applicationId).populate('job', 'postedBy title');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (userRole !== ROLES.ADMIN && application.job.postedBy.toString() !== employerId.toString()) {
    throw new AppError('Forbidden: You can only update applications for your own job listings', 403);
  }

  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw new AppError('Cannot update status of a withdrawn application', 400);
  }

  const oldStatus = application.status;
  application.status = newStatus;
  application.statusHistory.push({
    status: newStatus,
    changedBy: employerId,
    note: note || `Status updated from ${oldStatus} to ${newStatus}`,
    at: new Date(),
  });

  await application.save();

  // Audit Log
  await AuditLog.create({
    actor: employerId,
    action: 'APPLICATION_STATUS_UPDATED',
    entity: 'Application',
    entityId: application._id,
    meta: { oldStatus, newStatus, note },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  // Real-time notification & email to candidate
  try {
    const applicantUser = await User.findById(application.applicant).select('name email').lean();
    if (applicantUser) {
      const readableStatus = newStatus.replace('_', ' ').toUpperCase();
      await createNotification({
        user: application.applicant,
        type: 'status_updated',
        title: `Application Update: ${readableStatus}`,
        message: `Your application status for "${application.job.title}" is now ${readableStatus}.`,
        link: '/dashboard/seeker',
        data: { applicationId: application._id, newStatus, jobId: application.job._id },
      });

      emitToUser(application.applicant, 'application:status_updated', {
        applicationId: application._id,
        jobId: application.job._id,
        jobTitle: application.job.title,
        newStatus,
        note,
      });

      emailService.sendStatusUpdatedEmail(applicantUser, application.job, newStatus, note);
    }
  } catch (err) {
    logger.warn(`Failed to dispatch status update notification: ${err.message}`);
  }

  return application;
};

/**
 * Withdraw an application (Applicant only)
 */
export const withdrawApplication = async (applicantId, applicationId, note = '', meta = {}) => {
  const application = await Application.findById(applicationId).populate('job', 'title');
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  if (application.applicant.toString() !== applicantId.toString()) {
    throw new AppError('Forbidden: You can only withdraw your own applications', 403);
  }

  if (application.status === APPLICATION_STATUS.WITHDRAWN) {
    throw new AppError('This application has already been withdrawn', 400);
  }

  application.status = APPLICATION_STATUS.WITHDRAWN;
  application.statusHistory.push({
    status: APPLICATION_STATUS.WITHDRAWN,
    changedBy: applicantId,
    note: note || 'Application withdrawn by candidate',
    at: new Date(),
  });

  await application.save();

  // Decrement applications count on job
  await Job.findByIdAndUpdate(application.job._id, { $inc: { applicationsCount: -1 } });

  // Audit Log
  await AuditLog.create({
    actor: applicantId,
    action: 'APPLICATION_WITHDRAWN',
    entity: 'Application',
    entityId: application._id,
    meta: { note },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  return application;
};
