import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(70, 'Name cannot exceed 70 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  role: z.enum([ROLES.SEEKER, ROLES.EMPLOYER]).default(ROLES.SEEKER),
  companyName: z.string().trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  experienceYears: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.role === ROLES.EMPLOYER && !data.companyName) {
      return false;
    }
    return true;
  },
  {
    message: 'Company name is required for employer registration',
    path: ['companyName'],
  }
);

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(70).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().trim().optional(),
  skills: z.array(z.string().trim()).optional(),
  experienceYears: z.number().min(0).optional(),
  companyName: z.string().trim().optional(),
  companyWebsite: z.string().trim().url().optional().or(z.literal('')),
  companyLogo: z.string().trim().url().optional().or(z.literal('')),
});
