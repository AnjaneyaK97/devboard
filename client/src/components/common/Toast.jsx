import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { hideToast } from '../../redux/slices/uiSlice.js';

export default function Toast() {
  const toast = useSelector((state) => state.ui.toast);
  const dispatch = useDispatch();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800',
    error: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800',
    info: 'bg-teal-50 text-teal-900 border-teal-200 dark:bg-teal-950/80 dark:text-teal-200 dark:border-teal-800',
  }[toast.type || 'info'];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }[toast.type || 'info'];

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-sm">
      <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${bgStyles}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={() => dispatch(hideToast())}
          className="ml-auto p-1 rounded-md opacity-70 hover:opacity-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
