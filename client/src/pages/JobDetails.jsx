import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Sparkles,
  Bookmark,
  Send,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Eye,
  Globe,
  Briefcase,
} from 'lucide-react';
import { fetchJobDetail, toggleSaveJob } from '../redux/slices/jobSlice.js';
import { showToast } from '../redux/slices/uiSlice.js';
import ApplyModal from '../components/applications/ApplyModal.jsx';

export default function JobDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentJob, detailLoading } = useSelector((state) => state.jobs);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchJobDetail(id));
    }
  }, [dispatch, id]);

  const handleBookmark = () => {
    if (!isAuthenticated) {
      dispatch(showToast({ message: 'Please log in to save jobs', type: 'info' }));
      return;
    }
    dispatch(toggleSaveJob({ jobId: currentJob._id, isSaved: currentJob.isSaved }));
    dispatch(
      showToast({
        message: currentJob.isSaved ? 'Job removed from bookmarks' : 'Job bookmarked!',
        type: 'success',
      })
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    dispatch(showToast({ message: 'Job link copied to clipboard!', type: 'success' }));
  };

  if (detailLoading || !currentJob) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 animate-pulse" />
        <div className="h-32 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
        <div className="h-96 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
      </div>
    );
  }

  // Calculate candidate skill match
  let matchScore = null;
  if (user?.role === 'seeker' && user.skills?.length > 0 && currentJob.skills?.length > 0) {
    const userSkills = new Set(user.skills.map((s) => s.toLowerCase()));
    const matched = currentJob.skills.filter((s) => userSkills.has(s.toLowerCase()));
    matchScore = Math.round((matched.length / currentJob.skills.length) * 100);
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Salary undisclosed';
    if (min && !max) return `$${(min / 1000).toFixed(0)}k+/yr`;
    if (!min && max) return `Up to $${(max / 1000).toFixed(0)}k/yr`;
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k/yr`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to all jobs
        </Link>
      </div>

      {/* Main Job Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {currentJob.company}
              </span>
              {currentJob.remote && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Remote
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">
                {currentJob.jobType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {currentJob.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {currentJob.location}
              </span>
              <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
                <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {formatSalary(currentJob.salaryMin, currentJob.salaryMax)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {currentJob.views || 0} views
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Share Job"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleBookmark}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Save Job"
            >
              <Bookmark
                className={`w-4 h-4 ${currentJob.isSaved ? 'fill-teal-600 text-teal-600' : ''}`}
              />
            </button>

            {currentJob.hasApplied ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Applied ({currentJob.userApplication?.status || 'Active'})</span>
              </div>
            ) : user?.role === 'employer' ? (
              <div className="px-4 py-2 text-xs font-medium text-slate-400 italic">
                Viewing as Employer
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login', { state: { from: { pathname: `/jobs/${currentJob._id}` } } });
                  } else {
                    setIsApplyModalOpen(true);
                  }
                }}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md shadow-teal-500/20 transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Apply Now
              </button>
            )}
          </div>
        </div>

        {/* Smart Match Banner */}
        {matchScore !== null && (
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600 text-white rounded-xl shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Smart Match Score: {matchScore}%
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Computed from your profile skills & experience alignment with this job
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Description & Skills */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Job Description
              </h2>
              <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {currentJob.description}
              </div>
            </div>

            {/* Required Skills */}
            {currentJob.skills && currentJob.skills.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Required Technologies & Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentJob.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Company Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3">
              About the Company
            </h3>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                {currentJob.company}
              </h4>
              {currentJob.postedBy?.bio && (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {currentJob.postedBy.bio}
                </p>
              )}
            </div>

            {currentJob.postedBy?.companyWebsite && (
              <a
                href={currentJob.postedBy.companyWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              >
                <Globe className="w-3.5 h-3.5" /> Visit Company Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        job={currentJob}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
}
