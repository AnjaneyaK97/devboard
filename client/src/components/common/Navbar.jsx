import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Briefcase,
  User,
  LogOut,
  PlusCircle,
  Layers,
  FileText,
  Menu,
  X,
  Bookmark,
  Shield,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { logoutUser } from '../../redux/slices/authSlice.js';

export default function Navbar() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-teal-600 rounded-xl text-white group-hover:bg-teal-700 transition shadow-sm shadow-teal-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              DevBoard
            </span>
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Careers
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/jobs"
            className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition"
          >
            Find Jobs
          </Link>

          {isAuthenticated && user?.role === 'seeker' && (
            <>
              <Link
                to="/dashboard/seeker"
                className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Applications
              </Link>
              <Link
                to="/saved"
                className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition flex items-center gap-1.5"
              >
                <Bookmark className="w-4 h-4" />
                Saved
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'employer' && (
            <>
              <Link
                to="/dashboard/employer"
                className="text-sm font-medium text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-400 transition flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                Pipeline
              </Link>
              <Link
                to="/jobs/post"
                className="text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Post Job
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 transition flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* User / Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400"
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs border border-teal-300 dark:border-teal-800">
                  {user?.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{user?.role}</span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {isAuthenticated && <NotificationBell />}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/jobs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-700 dark:text-slate-200 py-1"
          >
            Find Jobs
          </Link>
          {isAuthenticated && user?.role === 'seeker' && (
            <>
              <Link
                to="/dashboard/seeker"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-700 dark:text-slate-200 py-1"
              >
                My Applications
              </Link>
              <Link
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-700 dark:text-slate-200 py-1"
              >
                Saved Jobs
              </Link>
            </>
          )}
          {isAuthenticated && user?.role === 'employer' && (
            <>
              <Link
                to="/dashboard/employer"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-700 dark:text-slate-200 py-1"
              >
                Applicant Pipeline
              </Link>
              <Link
                to="/jobs/post"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-teal-600 dark:text-teal-400 py-1"
              >
                Post a Job
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-base font-medium text-slate-700 dark:text-slate-200 py-1"
              >
                Profile ({user?.name})
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left text-base font-medium text-rose-600 dark:text-rose-400 py-1"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-medium bg-teal-600 text-white rounded-lg"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
