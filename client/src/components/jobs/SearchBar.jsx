import React, { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';

export default function SearchBar({ initialKeyword = '', initialLocation = '', onSearch }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword: keyword.trim(), location: location.trim() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 p-2 sm:p-2.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2"
    >
      <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Title, skills (e.g. React, Node.js), or company..."
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="sm:w-64 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900">
        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location or Remote"
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {location && (
          <button
            type="button"
            onClick={() => setLocation('')}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
      >
        Find Jobs
      </button>
    </form>
  );
}
