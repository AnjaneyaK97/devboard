import mongoose from 'mongoose';

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Search title is required'],
      trim: true,
      maxlength: [80, 'Title cannot exceed 80 characters'],
    },
    criteria: {
      keyword: { type: String, default: '' },
      location: { type: String, default: '' },
      jobType: { type: String, default: '' },
      experienceLevel: { type: String, default: '' },
      remote: { type: Boolean, default: null },
      salaryMin: { type: Number, default: 0 },
    },
    alertFrequency: {
      type: String,
      enum: ['none', 'daily', 'immediate'],
      default: 'daily',
    },
    lastAlertSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

savedSearchSchema.index({ user: 1, createdAt: -1 });
savedSearchSchema.index({ alertFrequency: 1 });

export const SavedSearch = mongoose.model('SavedSearch', savedSearchSchema);
