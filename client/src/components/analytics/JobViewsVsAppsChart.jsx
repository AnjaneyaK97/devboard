import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const views = payload.find((p) => p.dataKey === 'views')?.value || 0;
    const apps = payload.find((p) => p.dataKey === 'applicationsCount')?.value || 0;
    const rate = views > 0 ? ((apps / views) * 100).toFixed(1) : 0;

    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-bold text-teal-400">{label}</p>
        <p className="flex justify-between gap-4">
          <span className="text-slate-400">Total Views:</span>
          <span className="font-semibold text-slate-200">{views}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span className="text-slate-400">Applications:</span>
          <span className="font-semibold text-teal-300">{apps}</span>
        </p>
        <p className="flex justify-between gap-4 border-t border-slate-700/60 pt-1 mt-1">
          <span className="text-slate-400">Apply Rate:</span>
          <span className="font-semibold text-emerald-400">{rate}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function JobViewsVsAppsChart({ jobData = [] }) {
  if (!jobData || jobData.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        No job view metrics recorded yet.
      </div>
    );
  }

  // Format data for Recharts (truncate long job titles for axis)
  const chartData = jobData.slice(0, 6).map((job) => ({
    name: job.title.length > 18 ? `${job.title.substring(0, 18)}...` : job.title,
    fullTitle: job.title,
    views: job.views || 0,
    applicationsCount: job.applicationsCount || 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Views vs. Applications Comparison
          </h3>
        </div>
        <span className="text-xs text-slate-400">Top 6 Listings</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
            />
            <Bar
              dataKey="views"
              name="Views"
              fill="#cbd5e1"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Bar
              dataKey="applicationsCount"
              name="Applications"
              fill="#0d9488"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
