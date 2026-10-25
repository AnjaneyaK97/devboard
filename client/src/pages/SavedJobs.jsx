import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ArrowRight, Trash2, Bell, Sparkles, Search, ExternalLink } from 'lucide-react';
import { fetchSavedJobs, toggleSaveJob } from '../redux/slices/jobSlice.js';
import { addToast } from '../redux/slices/uiSlice.js';
import api from '../services/api.js';
import JobCard from '../components/jobs/JobCard.jsx';

export default function SavedJobs() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'alerts'
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingSearches, setLoadingSearches] = useState(false);

  const { savedJobs, loading: loadingJobs } = useSelector((state) => state.jobs);

  useEffect(() => {
    dispatch(fetchSavedJobs());
    fetchMySearches();
  }, [dispatch]);

  const fetchMySearches = async () => {
    setLoadingSearches(true);
    try {
      const res = await api.get('/saved-searches');
      setSavedSearches(res.data.data.savedSearches || []);
    } catch {
      // silently handle or log
    } finally {
      setLoadingSearches(false);
    }
  };

  const handleRemoveBookmark = (jobId) => {
    dispatch(toggleSaveJob({ jobId, isSaved: true }));
    dispatch(addToast({ message: 'Removed from bookmarks', type: 'info' }));
  };

  const handleDeleteSearch = async (searchId) => {
    try {
      await api.delete(`/saved-searches/${searchId}`);
      setSavedSearches((prev) => prev.filter((s) => s._id !== searchId));
      dispatch(addToast({ message: 'Search alert deleted', type: 'info' }));
    } catch {
      dispatch(addToast({ message: 'Failed to delete search alert', type: 'error' }));
    }
  };

  const constructSearchUrl = (criteria) => {
    const params = new URLSearchParams();
    if (criteria.keyword) params.set('keyword', criteria.keyword);
    if (criteria.location) params.set('location', criteria.location);
    if (criteria.jobType) params.set('jobType', criteria.jobType);
    if (criteria.experienceLevel) params.set('experienceLevel', criteria.experienceLevel);
    if (typeof criteria.remote === 'boolean') params.set('remote', criteria.remote.toString());
    if (criteria.salaryMin) params.set('salaryMin', criteria.salaryMin.toString());
    return `/jobs?${params.toString()}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-teal-600 fill-teal-600" /> Saved Opportunities
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your bookmarked positions and automated search alerts
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarked ({savedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Search Alerts ({savedSearches.length})
          </button>
        </div>
      </div>

      {/* Bookmarks Tab */}
      {activeTab === 'bookmarks' && (
        <>
          {savedJobs.length > 0 ? (
            <div className="space-y-4">
              {savedJobs.map((item) => (
                <div key={item._id} className="relative">
                  <JobCard
                    job={item.job}
                    isBookmarked={true}
                    onBookmarkToggle={() => handleRemoveBookmark(item.job._id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No saved jobs yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                When you see a job you like, click the bookmark icon to save it here for later.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs transition"
              >
                <span>Browse Jobs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}

      {/* Search Alerts Tab */}
      {activeTab === 'alerts' && (
        <>
          {savedSearches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedSearches.map((alert) => (
                <div
                  key={alert._id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {alert.title}
                          </h3>
                          <span className="text-[10px] text-slate-400 capitalize">
                            Frequency: {alert.alertFrequency}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSearch(alert._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg transition"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Criteria badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {alert.criteria?.keyword && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Keyword: {alert.criteria.keyword}
                        </span>
                      )}
                      {alert.criteria?.location && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Location: {alert.criteria.location}
                        </span>
                      )}
                      {alert.criteria?.remote && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-medium">
                          Remote
                        </span>
                      )}
                      {alert.criteria?.jobType && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {alert.criteria.jobType}
                        </span>
                      )}
                      {alert.criteria?.experienceLevel && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                          {alert.criteria.experienceLevel}
                        </span>
                      )}
                      {alert.criteria?.salaryMin > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          ${alert.criteria.salaryMin.toLocaleString()}+
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {alert.lastAlertSentAt
                        ? `Last alert: ${new Date(alert.lastAlertSentAt).toLocaleDateString()}`
                        : 'Active alert'}
                    </span>
                    <Link
                      to={constructSearchUrl(alert.criteria)}
                      className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition"
                    >
                      Run Search <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No active job alerts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Save time searching. Filter for your ideal criteria on the jobs page and click "Save Alert" to be notified the moment a match is posted.
              </p>
              <Link
                to="/jobs"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs transition"
              >
                <span>Find Jobs to Alert</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
