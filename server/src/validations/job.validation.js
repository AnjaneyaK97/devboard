import { z } from 'zod';
import { JOB_STATUS, JOB_TYPES, EXPERIENCE_LEVELS } from '../constants/status.js';

export const jobBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters'),
  company: z.string().trim().min(2, 'Company name is required'),
  location: z.string().trim().min(2, 'Location is required'),
  jobType: z.enum(JOB_TYPES, {
    errorMap: () => ({ message: `Job type must be one of: ${JOB_TYPES.join(', ')}` }),
  }),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, {
    errorMap: () => ({
      message: `Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`,
    }),
  }),
  salaryMin: z.number().min(0, 'Minimum salary cannot be negative').default(0),
  salaryMax: z.number().min(0, 'Maximum salary cannot be negative').default(0),
  skills: z.array(z.string().trim()).min(1, 'Please provide at least one required skill'),
  remote: z.boolean().default(false),
  status: z.enum(Object.values(JOB_STATUS)).default(JOB_STATUS.ACTIVE),
});

export const createJobSchema = jobBaseSchema.refine(
  (data) => {
    if (data.salaryMax > 0 && data.salaryMin > 0) {
      return data.salaryMax >= data.salaryMin;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than or equal to minimum salary',
    path: ['salaryMax'],
  }
);

export const updateJobSchema = jobBaseSchema.partial();

export const jobQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  location: z.string().trim().optional(),
  jobType: z.string().trim().optional(),
  experienceLevel: z.string().trim().optional(),
  remote: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  salaryMin: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
  salaryMax: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0))
    .optional(),
  skills: z.string().trim().optional(),
  sortBy: z.enum(['recent', 'salary', 'relevance', 'views']).default('recent'),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1))
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(50))
    .default('10'),
});
