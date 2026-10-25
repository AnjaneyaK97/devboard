import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, SlidersHorizontal, Search, RotateCcw, Bell } from 'lucide-react';
import { fetchJobs, fetchSavedJobs } from '../redux/slices/jobSlice.js';
import { addToast } from '../redux/slices/uiSlice.js';
import JobCard from '../components/jobs/JobCard.jsx';
import SearchBar from '../components/jobs/SearchBar.jsx';
import FilterPanel from '../components/jobs/FilterPanel.jsx';
import Pagination from '../components/jobs/Pagination.jsx';
import SaveSearchModal from '../components/jobs/SaveSearchModal.jsx';

export default function JobListings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const { jobs, pagination, loading, savedJobs } = useSelector((state) => state.jobs);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Extract filter parameters from URL
  const filters = useMemo(() => {
    return {
      keyword: searchParams.get('keyword') || '',
      location: searchParams.get('location') || '',
      jobType: searchParams.get('jobType') || '',
      experienceLevel: searchParams.get('experienceLevel') || '',
      remote: searchParams.get('remote') || '',
      salaryMin: searchParams.get('salaryMin') || '',
      sortBy: searchParams.get('sortBy') || 'recent',
      page: searchParams.get('page') || '1',
      limit: '10',
    };
  }, [searchParams]);

  useEffect(() => {
    dispatch(fetchJobs(filters));
    if (isAuthenticated && user?.role === 'seeker') {
      dispatch(fetchSavedJobs());
    }
  }, [dispatch, filters, isAuthenticated, user]);

  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        updated.set(key, val);
      } else {
        updated.delete(key);
      }
    });
    // Reset to page 1 on filter criteria change unless it's a page change
    if (!newFilters.page) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearch = ({ keyword, location }) => {
    updateFilters({ keyword, location, page: '1' });
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((sj) => sj.job?._id));
  }, [savedJobs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Search bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Explore Tech Careers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Find production-grade opportunities with transparent compensation & stack requirements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {pagination.total} roles available
            </span>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                  return;
                }
                setSaveModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-xs font-semibold transition shadow-sm"
              title="Create an automated alert for this search"
            >
              <Bell className="w-3.5 h-3.5" />
              Save Alert
            </button>
          </div>
        </div>

        <SearchBar
          initialKeyword={filters.keyword}
          initialLocation={filters.location}
          onSearch={handleSearch}
        />
      </div>

      {/* Main Grid: Filters Sidebar + Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <FilterPanel
            filters={filters}
            onChange={updateFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Listings Stream */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            // Skeleton Loaders
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3 animate-pulse"
                >
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    isBookmarked={savedJobIds.has(job._id)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            // Empty State
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No matching jobs found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Try widening your search terms, clearing some filters, or checking back soon for new postings.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <SaveSearchModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        criteria={{
          keyword: filters.keyword,
          location: filters.location,
          jobType: filters.jobType,
          experienceLevel: filters.experienceLevel,
          remote: filters.remote ? filters.remote === 'true' : null,
          salaryMin: filters.salaryMin ? Number(filters.salaryMin) : 0,
        }}
        onSaved={(saved) => {
          dispatch(
            addToast({
              type: 'success',
              message: `Job alert "${saved.title}" saved successfully!`,
            })
          );
        }}
      />
    </div>
  );
}
