import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { Filter, Users } from 'lucide-react';

const COLORS = ['#0d9488', '#059669', '#0284c7', '#6366f1', '#8b5cf6', '#10b981'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-bold text-teal-400">{data.stage}</p>
        <p className="flex justify-between gap-4">
          <span className="text-slate-400">Candidates:</span>
          <span className="font-semibold">{data.count}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-slate-400">Conversion from Top:</span>
          <span className="font-semibold text-emerald-400">{data.conversionRate}%</span>
        </p>
        {data.dropoff > 0 && (
          <p className="flex justify-between gap-4">
            <span className="text-slate-400">Stage Drop-off:</span>
            <span className="font-semibold text-rose-400">-{data.dropoff}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function FunnelChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No funnel data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Applicant-to-Hire Funnel
          </h3>
        </div>
        <span className="text-xs text-slate-400">Cumulative Progression</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="stage"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel Stage Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        {data.map((step, idx) => (
          <div
            key={step.stage}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center"
          >
            <span className="text-[10px] font-semibold text-slate-400 block truncate">
              {step.stage}
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {step.count}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
              {step.conversionRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
