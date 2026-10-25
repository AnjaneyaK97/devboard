import { z } from 'zod';
import { ALL_APPLICATION_STATUSES, APPLICATION_STATUS } from '../constants/status.js';

export const applyJobSchema = z.object({
  jobId: z.string().trim().min(1, 'Job ID is required'),
  resumeUrl: z.string().trim().min(1, 'Resume URL is required'),
  resumeOriginalName: z.string().trim().optional().default('resume.pdf'),
  coverNote: z
    .string()
    .trim()
    .max(2000, 'Cover note cannot exceed 2000 characters')
    .optional()
    .default(''),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(ALL_APPLICATION_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${ALL_APPLICATION_STATUSES.join(', ')}`,
    }),
  }).refine((val) => val !== APPLICATION_STATUS.WITHDRAWN, {
    message: 'Employers cannot set status to withdrawn; only applicants can withdraw',
  }),
  note: z.string().trim().max(1000, 'Note cannot exceed 1000 characters').optional().default(''),
});

export const withdrawApplicationSchema = z.object({
  note: z.string().trim().max(1000, 'Note cannot exceed 1000 characters').optional().default(''),
});
