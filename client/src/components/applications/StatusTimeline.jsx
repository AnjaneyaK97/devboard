import React from 'react';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge.jsx';

export default function StatusTimeline({ history = [] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-4 py-2">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Status Timeline & Activity History
      </h4>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
        {history.map((step, idx) => (
          <div key={idx} className="relative flex items-start gap-3">
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-500 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={step.status} />
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(step.at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {step.note && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  &ldquo;{step.note}&rdquo;
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
