import { describe, it, expect } from 'vitest';
import applicationReducer, {
  moveApplicantOptimistic,
  rollbackApplicantMove,
} from '../redux/slices/applicationSlice.js';

describe('Kanban Application Slice (Optimistic Drag-and-Drop & Rollback)', () => {
  const initialApplicants = [
    { _id: 'app_1', status: 'applied', applicant: { name: 'Alice' } },
    { _id: 'app_2', status: 'interview', applicant: { name: 'Bob' } },
  ];

  it('should optimistically update candidate status and back up previous state', () => {
    const initialState = {
      jobApplicants: initialApplicants,
      previousApplicantsBackup: [],
    };

    const nextState = applicationReducer(
      initialState,
      moveApplicantOptimistic({ applicationId: 'app_1', targetStatus: 'interview' })
    );

    // Candidate should now be in interview stage
    const updated = nextState.jobApplicants.find((a) => a._id === 'app_1');
    expect(updated.status).toBe('interview');

    // Backup should have the original state preserved
    expect(nextState.previousApplicantsBackup[0].status).toBe('applied');
  });

  it('should rollback to previous state when an API request fails', () => {
    // State after optimistic update
    const stateAfterMove = {
      jobApplicants: [
        { _id: 'app_1', status: 'interview', applicant: { name: 'Alice' } },
        { _id: 'app_2', status: 'interview', applicant: { name: 'Bob' } },
      ],
      previousApplicantsBackup: [
        { _id: 'app_1', status: 'applied', applicant: { name: 'Alice' } },
        { _id: 'app_2', status: 'interview', applicant: { name: 'Bob' } },
      ],
    };

    const rolledBackState = applicationReducer(stateAfterMove, rollbackApplicantMove());

    // Candidate should be restored to applied stage
    const restored = rolledBackState.jobApplicants.find((a) => a._id === 'app_1');
    expect(restored.status).toBe('applied');
    expect(rolledBackState.previousApplicantsBackup).toEqual([]);
  });
});
