import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Eye,
  CalendarCheck,
  PlusCircle,
  Edit,
  ExternalLink,
  Layers,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import {
  fetchEmployerListings,
  fetchJobApplicants,
  setSelectedJob,
} from '../redux/slices/applicationSlice.js';
import KanbanBoard from '../components/kanban/KanbanBoard.jsx';
import EmployerAnalytics from '../components/analytics/EmployerAnalytics.jsx';

export default function EmployerDashboard() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'analytics'
  const { employerJobs, selectedJob, jobApplicants, loading } = useSelector(
    (state) => state.applications
  );
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchEmployerListings());
  }, [dispatch]);

  useEffect(() => {
    if (selectedJob?._id) {
      dispatch(fetchJobApplicants({ jobId: selectedJob._id }));
    }
  }, [dispatch, selectedJob]);

  // Summary Metrics
  const totalJobs = employerJobs.length;
  const totalApplicants = employerJobs.reduce((acc, j) => acc + (j.applicationsCount || 0), 0);
  const totalViews = employerJobs.reduce((acc, j) => acc + (j.views || 0), 0);
  const interviewCount = jobApplicants.filter((a) => a.status === 'interview').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Employer Talent Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your open engineering positions and drag candidates through the hiring funnel
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Pipeline
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>

          <Link
            to="/jobs/post"
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition"
          >
            <PlusCircle className="w-4 h-4" /> Post Job
          </Link>
        </div>
      </div>

      {/* Body Content: Analytics View or Pipeline View */}
      {activeTab === 'analytics' ? (
        <EmployerAnalytics jobs={employerJobs} />
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Active Jobs</span>
                <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalJobs}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total Applicants</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalApplicants}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total Views</span>
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalViews}</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Interviews</span>
                <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{interviewCount}</p>
            </div>
          </div>

          {/* Pipeline Control Header & Job Selector */}
          {employerJobs.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Candidate Pipeline
                    </span>
                    <div className="relative inline-block mt-0.5">
                      <select
                        value={selectedJob?._id || ''}
                        onChange={(e) => {
                          const found = employerJobs.find((j) => j._id === e.target.value);
                          if (found) dispatch(setSelectedJob(found));
                        }}
                        className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-none pr-8 focus:outline-none cursor-pointer"
                      >
                        {employerJobs.map((j) => (
                          <option key={j._id} value={j._id} className="dark:bg-slate-800">
                            {j.title} ({j.applicationsCount || 0} applicants)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {selectedJob && (
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Link
                      to={`/jobs/${selectedJob._id}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Public Page
                    </Link>
                    <Link
                      to={`/jobs/${selectedJob._id}/edit`}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Job
                    </Link>
                  </div>
                )}
              </div>

              {/* Kanban Board Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <span>Drag candidate cards across columns to advance them through stages.</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    {jobApplicants.length} Total Applicants
                  </span>
                </div>
                <KanbanBoard applications={jobApplicants} />
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No active job openings posted
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create your first job posting to start receiving applications and managing candidates through your Kanban pipeline.
              </p>
              <Link
                to="/jobs/post"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition"
              >
                <PlusCircle className="w-4 h-4" /> Create First Job Posting
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
