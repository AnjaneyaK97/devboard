import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Sparkles,
  Layers,
  Zap,
  ArrowRight,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export default function Home() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.append('keyword', keyword.trim());
    if (location.trim()) params.append('location', location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  const quickPills = [
    { label: 'React', query: 'keyword=react' },
    { label: 'Node.js', query: 'keyword=node.js' },
    { label: 'Remote', query: 'remote=true' },
    { label: 'Full-Stack', query: 'keyword=full-stack' },
    { label: 'Python', query: 'keyword=python' },
    { label: 'TypeScript', query: 'keyword=typescript' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 bg-gradient-to-b from-teal-50/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Smart Skill Matching Engine Powered by MERN</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            The Production Job Board for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-500">
              Modern Developers
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Discover roles with transparent salaries, algorithmic skill matching scores, real-time application pipelines, and instant status updates.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white dark:bg-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2"
          >
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, keywords, or skills..."
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="sm:w-1/3 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
              <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or Remote"
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs font-semibold text-slate-400">Popular:</span>
            {quickPills.map((pill) => (
              <Link
                key={pill.label}
                to={`/jobs?${pill.query}`}
                className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition"
              >
                {pill.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Differentiators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Built Different for Engineering Excellence
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Every feature on DevBoard solves a real workflow headache faced by candidates and hiring managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Smart Job Matching Score
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our weighted matching algorithm compares your verified skills and experience years against posting requirements, surfacing personalized match badges.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200 dark:border-cyan-800">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Kanban Applicant Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Employers drag and drop applicants across stages with optimistic updates and automatic rollback. Every transition logs an audit history timeline.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Real-Time Notifications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Socket.IO delivers live in-app alerts when an application arrives or your interview status updates, backed by an async email queue.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-teal-700 to-cyan-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to take the next step in your career?
            </h3>
            <p className="text-sm text-teal-100 max-w-lg">
              Create your candidate profile in under 2 minutes, upload your resume, and start matching with top companies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-teal-900 hover:bg-teal-50 font-bold rounded-xl text-sm transition shadow-md"
            >
              Sign Up as Candidate
            </Link>
            <Link
              to="/jobs"
              className="px-6 py-3 bg-teal-800/60 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm border border-teal-600/40 transition"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
