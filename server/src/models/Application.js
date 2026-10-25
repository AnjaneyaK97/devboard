import mongoose from 'mongoose';
import { APPLICATION_STATUS, ALL_APPLICATION_STATUSES } from '../constants/status.js';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ALL_APPLICATION_STATUSES,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant reference is required'],
    },
    resumeUrl: {
      type: String,
      required: [true, 'Resume URL is required'],
    },
    resumeOriginalName: {
      type: String,
      default: 'resume.pdf',
    },
    coverNote: {
      type: String,
      trim: true,
      maxlength: [2000, 'Cover note cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ALL_APPLICATION_STATUSES,
        message: '{VALUE} is not a valid application status',
      },
      default: APPLICATION_STATUS.APPLIED,
    },
    statusHistory: [statusHistorySchema],
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications: One application per applicant per job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Performance indexes
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ status: 1 });

export const Application = mongoose.model('Application', applicationSchema);
