import mongoose from 'mongoose';
import { JOB_STATUS, ALL_JOB_STATUSES, JOB_TYPES, EXPERIENCE_LEVELS } from '../constants/status.js';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Job title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: {
        values: JOB_TYPES,
        message: '{VALUE} is not a valid job type',
      },
      default: 'full-time',
    },
    experienceLevel: {
      type: String,
      enum: {
        values: EXPERIENCE_LEVELS,
        message: '{VALUE} is not a valid experience level',
      },
      default: 'mid',
    },
    salaryMin: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative'],
      default: 0,
    },
    salaryMax: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      default: 0,
    },
    skills: {
      type: [{ type: String, lowercase: true, trim: true }],
      default: [],
    },
    remote: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: {
        values: ALL_JOB_STATUSES,
        message: '{VALUE} is not a valid job status',
      },
      default: JOB_STATUS.ACTIVE,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job must be associated with an employer'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// 1. Text index for search scoring
jobSchema.index(
  {
    title: 'text',
    company: 'text',
    skills: 'text',
    description: 'text',
  },
  {
    weights: {
      title: 10,
      skills: 5,
      company: 3,
      description: 1,
    },
    name: 'JobTextIndex',
  }
);

// 2. Compound indexes for filtering & sorting
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ status: 1, remote: 1, jobType: 1 });
jobSchema.index({ status: 1, experienceLevel: 1 });
jobSchema.index({ postedBy: 1, status: 1 });
jobSchema.index({ skills: 1 });

export const Job = mongoose.model('Job', jobSchema);
