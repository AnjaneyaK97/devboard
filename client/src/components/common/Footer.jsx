import React from 'react';
import { Briefcase, Heart, Github, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-600 rounded-lg text-white">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">DevBoard</span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The production-grade full-stack tech job board platform connecting exceptional engineers with high-growth engineering teams.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 dark:hover:text-slate-200">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 dark:hover:text-slate-200">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-600 dark:hover:text-slate-200">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Job Seekers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              For Job Seekers
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/jobs" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  Explore Tech Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs?remote=true" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  Remote Developer Jobs
                </Link>
              </li>
              <li>
                <Link to="/dashboard/seeker" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  Track Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* Employers */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              For Employers
            </h3>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <Link to="/jobs/post" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  Post a Job Opening
                </Link>
              </li>
              <li>
                <Link to="/dashboard/employer" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  Kanban Candidate Pipeline
                </Link>
              </li>
              <li>
                <a href="/api/docs" target="_blank" rel="noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 transition">
                  API & Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Stack & Production Readiness */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Platform Architecture
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {['MongoDB Atlas', 'Express.js', 'React 18', 'Node 22', 'Socket.IO', 'Tailwind', 'Redis', 'Docker'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} DevBoard Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for modern developers
          </p>
        </div>
      </div>
    </footer>
  );
}
