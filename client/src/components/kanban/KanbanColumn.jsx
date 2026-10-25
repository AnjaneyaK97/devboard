import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard.jsx';

export default function KanbanColumn({ id, title, colorClass, applications = [] }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col w-72 flex-shrink-0 bg-slate-100/70 dark:bg-slate-900/50 rounded-3xl p-3 border border-slate-200 dark:border-slate-800">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
          {applications.length}
        </span>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[350px] rounded-2xl p-1 space-y-3 transition-colors ${
          isOver
            ? 'bg-teal-50/60 dark:bg-teal-950/30 border-2 border-dashed border-teal-500/80'
            : ''
        }`}
      >
        {applications.length > 0 ? (
          applications.map((app) => <KanbanCard key={app._id} application={app} />)
        ) : (
          <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] text-slate-400 font-medium">
            Drop applicants here
          </div>
        )}
      </div>
    </div>
  );
}
