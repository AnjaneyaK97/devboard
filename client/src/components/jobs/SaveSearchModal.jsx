import React, { useState } from 'react';
import { X, Bell, Check, Sparkles } from 'lucide-react';
import api from '../../services/api.js';

export default function SaveSearchModal({ isOpen, onClose, criteria, onSaved }) {
  const [title, setTitle] = useState('');
  const [alertFrequency, setAlertFrequency] = useState('immediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Generate suggested title based on criteria
  const suggestedTitle =
    [
      criteria.keyword ? `"${criteria.keyword}"` : '',
      criteria.location ? `in ${criteria.location}` : '',
      criteria.remote ? '(Remote)' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'Custom Search Alert';

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/saved-searches', {
        title: title.trim() || suggestedTitle,
        criteria,
        alertFrequency,
      });

      if (onSaved) {
        onSaved(res.data.data.savedSearch);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save search alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create Job Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified when matching jobs are posted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
            {error}
          </div>
        )}

        {/* Criteria summary */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Filter Criteria
          </span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {criteria.keyword && (
              <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                Keyword: {criteria.keyword}
              </span>
            )}
            {criteria.location && (
              <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                Location: {criteria.location}
              </span>
            )}
            {criteria.jobType && (
              <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium capitalize">
                {criteria.jobType}
              </span>
            )}
            {criteria.experienceLevel && (
              <span className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium capitalize">
                {criteria.experienceLevel}
              </span>
            )}
            {criteria.remote && (
              <span className="text-xs px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-700 dark:text-teal-300 font-medium">
                Remote Only
              </span>
            )}
            {!criteria.keyword && !criteria.location && !criteria.jobType && !criteria.experienceLevel && !criteria.remote && (
              <span className="text-xs text-slate-400 italic">All newly posted jobs</span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alert Name
            </label>
            <input
              type="text"
              placeholder={suggestedTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notification Frequency
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAlertFrequency('immediate')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  alertFrequency === 'immediate'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Instant
                  </span>
                  {alertFrequency === 'immediate' && (
                    <Check className="w-4 h-4 text-teal-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Notify right away via in-app & email
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAlertFrequency('daily')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  alertFrequency === 'daily'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Daily Digest
                  </span>
                  {alertFrequency === 'daily' && (
                    <Check className="w-4 h-4 text-teal-600" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Summary batch of daily matching posts
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {loading ? 'Saving...' : 'Save Job Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
