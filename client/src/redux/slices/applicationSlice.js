import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

export const fetchSeekerApplications = createAsyncThunk(
  'applications/fetchSeekerApplications',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/applications/my?page=${page}&limit=${limit}`);
      return {
        applications: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch your applications');
    }
  }
);

export const fetchJobApplicants = createAsyncThunk(
  'applications/fetchJobApplicants',
  async ({ jobId, status = '' }, { rejectWithValue }) => {
    try {
      const url = status
        ? `/applications/job/${jobId}?status=${status}&limit=100`
        : `/applications/job/${jobId}?limit=100`;
      const response = await api.get(url);
      return {
        job: response.data.job,
        applications: response.data.data,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch applicants');
    }
  }
);

export const updateApplicantStatus = createAsyncThunk(
  'applications/updateApplicantStatus',
  async ({ applicationId, status, note = '' }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/applications/${applicationId}/status`, { status, note });
      return response.data.data.application;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update applicant status');
    }
  }
);

export const withdrawApplicationAction = createAsyncThunk(
  'applications/withdrawApplicationAction',
  async ({ applicationId, note = '' }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/applications/${applicationId}/withdraw`, { note });
      return response.data.data.application;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to withdraw application');
    }
  }
);

export const fetchEmployerListings = createAsyncThunk(
  'applications/fetchEmployerListings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/jobs/my/listings?limit=50');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load your job listings');
    }
  }
);

const applicationSlice = createSlice({
  name: 'applications',
  initialState: {
    seekerApplications: [],
    seekerPagination: { total: 0, page: 1, totalPages: 1 },
    employerJobs: [],
    selectedJob: null,
    jobApplicants: [], // Current applicants loaded in Kanban
    previousApplicantsBackup: [], // Backup for rollback on failure
    loading: false,
    updatingStatus: false,
    error: null,
  },
  reducers: {
    setSelectedJob: (state, action) => {
      state.selectedJob = action.payload;
    },
    // Optimistic move for Drag-and-Drop Kanban
    moveApplicantOptimistic: (state, action) => {
      const { applicationId, targetStatus } = action.payload;
      state.previousApplicantsBackup = JSON.parse(JSON.stringify(state.jobApplicants));
      const targetApp = state.jobApplicants.find((app) => app._id === applicationId);
      if (targetApp) {
        targetApp.status = targetStatus;
      }
    },
    // Rollback move if backend API rejected the move
    rollbackApplicantMove: (state) => {
      state.jobApplicants = state.previousApplicantsBackup;
      state.previousApplicantsBackup = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Seeker Apps
      .addCase(fetchSeekerApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeekerApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.seekerApplications = action.payload.applications;
        state.seekerPagination = action.payload.pagination;
      })
      .addCase(fetchSeekerApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Employer Listings
      .addCase(fetchEmployerListings.fulfilled, (state, action) => {
        state.employerJobs = action.payload;
        if (!state.selectedJob && action.payload.length > 0) {
          state.selectedJob = action.payload[0];
        }
      })
      // Kanban Applicants
      .addCase(fetchJobApplicants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchJobApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.jobApplicants = action.payload.applications;
      })
      .addCase(fetchJobApplicants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Status update confirmed
      .addCase(updateApplicantStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.jobApplicants.findIndex((a) => a._id === updated._id);
        if (index !== -1) {
          state.jobApplicants[index] = { ...state.jobApplicants[index], ...updated };
        }
        state.previousApplicantsBackup = [];
      })
      .addCase(updateApplicantStatus.rejected, (state, action) => {
        // Rollback on rejection
        if (state.previousApplicantsBackup.length > 0) {
          state.jobApplicants = state.previousApplicantsBackup;
          state.previousApplicantsBackup = [];
        }
        state.error = action.payload;
      })
      // Withdraw
      .addCase(withdrawApplicationAction.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.seekerApplications.findIndex((a) => a._id === updated._id);
        if (index !== -1) {
          state.seekerApplications[index] = { ...state.seekerApplications[index], ...updated };
        }
      });
  },
});

export const { setSelectedJob, moveApplicantOptimistic, rollbackApplicantMove } =
  applicationSlice.actions;
export default applicationSlice.reducer;
