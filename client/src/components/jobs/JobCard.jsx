import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Sparkles,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { toggleSaveJob } from '../../redux/slices/jobSlice.js';
import { showToast } from '../../redux/slices/uiSlice.js';

export default function JobCard({ job, onBookmarkToggle, isBookmarked = false }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // Compute smart match score client-side if candidate has skills
  let matchScore = null;
  if (user?.role === 'seeker' && user.skills?.length > 0 && job.skills?.length > 0) {
    const userSkills = new Set(user.skills.map((s) => s.toLowerCase()));
    const matched = job.skills.filter((s) => userSkills.has(s.toLowerCase()));
    matchScore = Math.round((matched.length / job.skills.length) * 100);
  }

  const handleSaveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      dispatch(showToast({ message: 'Please log in to save jobs', type: 'info' }));
      return;
    }
    if (onBookmarkToggle) {
      onBookmarkToggle(job._id);
    } else {
      dispatch(toggleSaveJob({ jobId: job._id, isSaved: isBookmarked }));
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary undisclosed';
    if (min && !max) return `$${(min / 1000).toFixed(0)}k+/yr`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k/yr`;
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k/yr`;
  };

  // Format relative time (e.g. 2d ago)
  const getRelativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 hover:border-teal-500/50 dark:hover:border-teal-500/50 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.company}
            </span>

            {job.remote && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Remote
              </span>
            )}

            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
              {job.jobType}
            </span>
          </div>

          <Link to={`/jobs/${job._id}`} className="block">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition truncate">
              {job.title}
            </h3>
          </Link>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location}
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <DollarSign className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {getRelativeTime(job.createdAt)}
            </span>
          </div>
        </div>

        {/* Right Action: Bookmark & Match Badge */}
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleSaveClick}
            aria-label="Bookmark Job"
            className="p-2 rounded-xl text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-teal-600 text-teal-600' : ''}`} />
          </button>

          {matchScore !== null && (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                matchScore >= 75
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : matchScore >= 40
                  ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {matchScore}% Match
            </span>
          )}
        </div>
      </div>

      {/* Skills tags */}
      {job.skills && job.skills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-medium self-center">
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
