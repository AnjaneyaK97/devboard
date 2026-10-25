import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, FileText, Sparkles, MapPin, GripVertical } from 'lucide-react';

export default function KanbanCard({ application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application._id,
    data: { application },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
      }
    : undefined;

  const applicant = application.applicant || {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3 transition-shadow ${
        isDragging ? 'shadow-2xl opacity-90 border-teal-500 scale-105' : 'hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">
            {applicant.name ? applicant.name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {applicant.name || 'Candidate'}
            </h4>
            <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
              {applicant.email}
            </span>
          </div>
        </div>

        {/* Drag handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Drag candidate to move stage"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Match Score & Experience */}
      <div className="flex items-center justify-between text-[11px] pt-1">
        {application.matchScore !== undefined && (
          <span className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400">
            <Sparkles className="w-3 h-3" />
            {application.matchScore}% Match
          </span>
        )}
        {applicant.experienceYears !== undefined && (
          <span className="text-slate-400">{applicant.experienceYears} yrs exp</span>
        )}
      </div>

      {/* Skills */}
      {applicant.skills && applicant.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {applicant.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {s}
            </span>
          ))}
          {applicant.skills.length > 3 && (
            <span className="text-[9px] text-slate-400 font-medium self-center">
              +{applicant.skills.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Resume link */}
      {application.resumeUrl && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
          <a
            href={application.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline font-semibold"
          >
            <FileText className="w-3 h-3" /> Resume PDF
          </a>
        </div>
      )}
    </div>
  );
}
