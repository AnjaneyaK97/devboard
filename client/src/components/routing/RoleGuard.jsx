import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user } = useSelector((state) => state.auth);

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-rose-200 dark:border-rose-900/50 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This portal is restricted to {allowedRoles.join(' or ')} accounts. Your account role is &quot;{user?.role}&quot;.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 transition"
        >
          Return to Home
        </a>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
