import React from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDispatch } from 'react-redux';
import KanbanColumn from './KanbanColumn.jsx';
import {
  moveApplicantOptimistic,
  updateApplicantStatus,
  rollbackApplicantMove,
} from '../../redux/slices/applicationSlice.js';
import { showToast } from '../../redux/slices/uiSlice.js';

const COLUMNS = [
  { id: 'applied', title: 'Applied', colorClass: 'bg-blue-500' },
  { id: 'under_review', title: 'Under Review', colorClass: 'bg-amber-500' },
  { id: 'shortlisted', title: 'Shortlisted', colorClass: 'bg-indigo-500' },
  { id: 'interview', title: 'Interview', colorClass: 'bg-purple-500' },
  { id: 'offered', title: 'Offer Extended', colorClass: 'bg-teal-500' },
  { id: 'hired', title: 'Hired 🎉', colorClass: 'bg-emerald-500' },
  { id: 'rejected', title: 'Rejected', colorClass: 'bg-rose-500' },
];

export default function KanbanBoard({ applications = [] }) {
  const dispatch = useDispatch();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const applicationId = active.id;
    const targetStatus = over.id; // column status ID

    // Find current application
    const app = applications.find((a) => a._id === applicationId);
    if (!app || app.status === targetStatus) return;

    // 1. Optimistic update
    dispatch(moveApplicantOptimistic({ applicationId, targetStatus }));

    // 2. Perform backend update
    const result = await dispatch(
      updateApplicantStatus({
        applicationId,
        status: targetStatus,
        note: `Candidate transitioned to ${targetStatus} via Kanban board`,
      })
    );

    // 3. Rollback if failure
    if (!updateApplicantStatus.fulfilled.match(result)) {
      dispatch(rollbackApplicantMove());
      dispatch(
        showToast({
          message: 'Failed to update applicant status. Changes rolled back.',
          type: 'error',
        })
      );
    } else {
      dispatch(
        showToast({
          message: `Candidate moved to ${targetStatus}`,
          type: 'success',
        })
      );
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              colorClass={col.colorClass}
              applications={colApps}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
