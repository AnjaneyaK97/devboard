import React from 'react';
import { Clock, CheckCircle2, Zap, Award } from 'lucide-react';

export default function TimeToHireCard({ data }) {
  const {
    avgDaysToHire = 0,
    minDaysToHire = 0,
    maxDaysToHire = 0,
    totalHires = 0,
    recentHires = [],
  } = data || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Time-to-Hire Velocity
          </h3>
        </div>
        <span className="text-xs text-slate-400">Application &rarr; Offer Accepted</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block">Avg. Velocity</span>
          <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400 block mt-0.5">
            {avgDaysToHire}d
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block flex items-center justify-center gap-0.5">
            <Zap className="w-2.5 h-2.5 text-amber-500" /> Fastest Hire
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {totalHires > 0 ? `${minDaysToHire}d` : '—'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[10px] font-semibold text-slate-400 block flex items-center justify-center gap-0.5">
            <Award className="w-2.5 h-2.5 text-purple-500" /> Total Hires
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white block mt-0.5">
            {totalHires}
          </span>
        </div>
      </div>

      {/* Recent Hires Breakdown */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Recent Placements
        </span>

        {recentHires.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-48 overflow-y-auto">
            {recentHires.map((hire, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {hire.applicantName || 'Candidate'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    {hire.jobTitle}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    {hire.daysToHire} days
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No candidates marked as hired yet. Advance candidates to "Hired" in the pipeline to track velocity.
          </div>
        )}
      </div>
    </div>
  );
}
