import React from 'react';
import { Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';

export default function FilterPanel({ filters, onChange, onReset }) {
  const jobTypes = [
    { label: 'All Types', value: '' },
    { label: 'Full-time', value: 'full-time' },
    { label: 'Part-time', value: 'part-time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Internship', value: 'internship' },
  ];

  const experienceLevels = [
    { label: 'All Levels', value: '' },
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior', value: 'senior' },
    { label: 'Lead / Principal', value: 'lead' },
  ];

  const sortOptions = [
    { label: 'Most Recent', value: 'recent' },
    { label: 'Highest Salary', value: 'salary' },
    { label: 'Relevance', value: 'relevance' },
    { label: 'Most Viewed', value: 'views' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          Filter Jobs
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Sort Results By
        </label>
        <select
          value={filters.sortBy || 'recent'}
          onChange={(e) => onChange({ sortBy: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Remote Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.remote === 'true' || filters.remote === true}
            onChange={(e) => onChange({ remote: e.target.checked ? 'true' : '' })}
            className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Remote Only Roles
          </span>
        </label>
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Job Type
        </label>
        <div className="space-y-1.5">
          {jobTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
              <input
                type="radio"
                name="jobType"
                value={type.value}
                checked={(filters.jobType || '') === type.value}
                onChange={() => onChange({ jobType: type.value })}
                className="w-3.5 h-3.5 text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Experience Level
        </label>
        <div className="space-y-1.5">
          {experienceLevels.map((lvl) => (
            <label key={lvl.value} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
              <input
                type="radio"
                name="experienceLevel"
                value={lvl.value}
                checked={(filters.experienceLevel || '') === lvl.value}
                onChange={() => onChange({ experienceLevel: lvl.value })}
                className="w-3.5 h-3.5 text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>{lvl.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Salary */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Minimum Salary (USD/yr)
        </label>
        <select
          value={filters.salaryMin || ''}
          onChange={(e) => onChange({ salaryMin: e.target.value })}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="">Any Salary</option>
          <option value="60000">$60,000+/yr</option>
          <option value="90000">$90,000+/yr</option>
          <option value="120000">$120,000+/yr</option>
          <option value="150000">$150,000+/yr</option>
          <option value="180000">$180,000+/yr</option>
        </select>
      </div>
    </div>
  );
}
