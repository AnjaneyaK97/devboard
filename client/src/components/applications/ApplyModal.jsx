import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, FileText, Send, AlertCircle, Building2 } from 'lucide-react';
import { submitApplication } from '../../redux/slices/jobSlice.js';
import { showToast } from '../../redux/slices/uiSlice.js';

const applySchema = z.object({
  resumeUrl: z.string().trim().min(1, 'Please provide your resume URL (PDF link)'),
  coverNote: z.string().max(2000, 'Cover note cannot exceed 2000 characters').optional(),
});

export default function ApplyModal({ job, isOpen, onClose }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: {
      resumeUrl: user?.resumeUrl || 'https://example.com/resumes/sample_resume.pdf',
      coverNote: '',
    },
  });

  if (!isOpen || !job) return null;

  const onSubmit = async (data) => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await dispatch(
      submitApplication({
        jobId: job._id,
        resumeUrl: data.resumeUrl,
        resumeOriginalName: `${user?.name || 'applicant'}_resume.pdf`,
        coverNote: data.coverNote || '',
      })
    );

    setSubmitting(false);

    if (submitApplication.fulfilled.match(result)) {
      dispatch(
        showToast({
          message: `Application submitted for ${job.title}!`,
          type: 'success',
        })
      );
      onClose();
    } else {
      setErrorMessage(result.payload || 'Failed to submit application. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.company}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Apply for {job.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Resume Link (PDF URL or Cloud Storage)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                {...register('resumeUrl')}
                placeholder="https://drive.google.com/... or Cloudinary link"
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
            {errors.resumeUrl && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.resumeUrl.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Cover Note / Why You are a Great Fit (Optional)
            </label>
            <textarea
              rows={4}
              {...register('coverNote')}
              placeholder="Highlight relevant projects, technologies, and why this role excites you..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
            {errors.coverNote && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                {errors.coverNote.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-500/20 transition flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
