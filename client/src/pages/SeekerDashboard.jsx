import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  fetchSeekerApplications,
  withdrawApplicationAction,
} from '../redux/slices/applicationSlice.js';
import { showToast } from '../redux/slices/uiSlice.js';
import StatusBadge from '../components/applications/StatusBadge.jsx';
import StatusTimeline from '../components/applications/StatusTimeline.jsx';
import JobCard from '../components/jobs/JobCard.jsx';
import { api } from '../services/api.js';

export default function SeekerDashboard() {
  const dispatch = useDispatch();
  const { seekerApplications, loading } = useSelector((state) => state.applications);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchSeekerApplications());
    setRecLoading(true);
    api
      .get('/jobs/recommended?limit=3')
      .then((res) => {
        setRecommendedJobs(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setRecLoading(false));
  }, [dispatch]);

  const toggleExpand = (id) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  const handleWithdraw = async (applicationId) => {
    if (window.confirm('Are you sure you want to withdraw your application? This action cannot be undone.')) {
      setWithdrawingId(applicationId);
      const result = await dispatch(
        withdrawApplicationAction({
          applicationId,
          note: 'Application withdrawn by candidate from dashboard',
        })
      );
      setWithdrawingId(null);

      if (withdrawApplicationAction.fulfilled.match(result)) {
        dispatch(showToast({ message: 'Application withdrawn', type: 'info' }));
      } else {
        dispatch(
          showToast({
            message: result.payload || 'Failed to withdraw application',
            type: 'error',
          })
        );
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Applications Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your status, recruiter notes, and review history timelines
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit">
          {seekerApplications.length} Total Submissions
        </span>
      </div>

      {/* Recommended for You Section */}
      {recommendedJobs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Recommended for You (Top Matches)
            </h2>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : seekerApplications.length > 0 ? (
        <div className="space-y-4">
          {seekerApplications.map((app) => {
            const isExpanded = expandedAppId === app._id;
            const isWithdrawn = app.status === 'withdrawn';

            return (
              <div
                key={app._id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {app.job?.company || 'Company'}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>

                      <Link
                        to={`/jobs/${app.job?._id}`}
                        className="text-lg font-bold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition block"
                      >
                        {app.job?.title || 'Job Opening'}
                      </Link>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                        {app.matchScore !== undefined && (
                          <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                            <Sparkles className="w-3.5 h-3.5" />
                            {app.matchScore}% Match
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {!isWithdrawn && (
                        <button
                          type="button"
                          disabled={withdrawingId === app._id}
                          onClick={() => handleWithdraw(app._id)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition border border-rose-200 dark:border-rose-900/60"
                        >
                          {withdrawingId === app._id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(app._id)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1 text-xs font-semibold"
                      >
                        <span>{isExpanded ? 'Hide History' : 'View Timeline'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable History Timeline */}
                  {isExpanded && (
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 space-y-4 animate-fade-in">
                      {app.coverNote && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-[11px] font-bold text-slate-400 block mb-1">
                            Your Submitted Cover Note:
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                            &ldquo;{app.coverNote}&rdquo;
                          </p>
                        </div>
                      )}

                      <StatusTimeline history={app.statusHistory} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No applications submitted yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Explore active openings and apply directly. Your progress and recruiter feedback will show here.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs transition"
          >
            <span>Explore Open Roles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
