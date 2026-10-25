export const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
};

export const ALL_JOB_STATUSES = Object.values(JOB_STATUS);

export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  UNDER_REVIEW: 'under_review',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  OFFERED: 'offered',
  REJECTED: 'rejected',
  HIRED: 'hired',
  WITHDRAWN: 'withdrawn',
};

export const ALL_APPLICATION_STATUSES = Object.values(APPLICATION_STATUS);

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
export const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];
