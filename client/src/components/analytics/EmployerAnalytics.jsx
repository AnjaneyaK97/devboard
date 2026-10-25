import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Percent,
  Layers,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api.js';
import FunnelChart from './FunnelChart.jsx';
import JobViewsVsAppsChart from './JobViewsVsAppsChart.jsx';
import TimeToHireCard from './TimeToHireCard.jsx';

export default function EmployerAnalytics({ jobs = [] }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [summary, setSummary] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [timeToHireData, setTimeToHireData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedJobId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const queryParam = selectedJobId ? `?jobId=${selectedJobId}` : '';
      const [summaryRes, funnelRes, tthRes] = await Promise.all([
        api.get('/analytics/employer/summary'),
        api.get(`/analytics/employer/funnel${queryParam}`),
        api.get(`/analytics/employer/time-to-hire${queryParam}`),
      ]);

      setSummary(summaryRes.data.data);
      setFunnelData(funnelRes.data.data);
      setTimeToHireData(tthRes.data.data);
    } catch {
      // Handle error gracefully
    } finally {
      setLoading(false);
    }
  };

  const overview = summary?.overview || {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === 'active').length,
    totalViews: jobs.reduce((acc, j) => acc + (j.views || 0), 0),
    totalApplications: jobs.reduce((acc, j) => acc + (j.applicationsCount || 0), 0),
    overallConversionRate: 0,
  };

  const jobPerformance = summary?.jobPerformance || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Filter & Scope Selector */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Analytics Scope
            </span>
            <div className="relative inline-block mt-0.5">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="font-bold text-base text-slate-900 dark:text-white bg-transparent border-none pr-8 focus:outline-none cursor-pointer"
              >
                <option value="" className="dark:bg-slate-800">
                  All Openings Combined ({jobs.length} jobs)
                </option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id} className="dark:bg-slate-800">
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto">
          Updated in real time
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Jobs</span>
            <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.activeJobs}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {overview.totalJobs}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Views</span>
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.totalViews.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Applications</span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.totalApplications.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Apply Rate</span>
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {overview.overallConversionRate}%
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Applicant Funnel Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <FunnelChart data={funnelData?.funnel} />
        </div>

        {/* Time to Hire Velocity */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <TimeToHireCard data={timeToHireData} />
        </div>
      </div>

      {/* Secondary Analytics: Volume Comparison & Detailed Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Views vs Apps Comparison Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <JobViewsVsAppsChart jobData={jobPerformance} />
        </div>

        {/* Detailed Conversion Table */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Listing Performance Breakdown
            </h3>
            <span className="text-xs text-slate-400">{jobPerformance.length} listings</span>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
                <tr>
                  <th className="pb-2">Job Title</th>
                  <th className="pb-2 text-right">Views</th>
                  <th className="pb-2 text-right">Apps</th>
                  <th className="pb-2 text-right">Apply %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobPerformance.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-[180px] truncate">
                      <Link
                        to={`/jobs/${job._id}`}
                        target="_blank"
                        className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1"
                      >
                        <span className="truncate">{job.title}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
                      </Link>
                    </td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400">
                      {job.views || 0}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-teal-600 dark:text-teal-400">
                      {job.applicationsCount || 0}
                    </td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {job.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
