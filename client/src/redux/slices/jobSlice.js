import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api.js';

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (queryParams = {}, { rejectWithValue }) => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const response = await api.get(`/jobs?${searchParams.toString()}`);
      return {
        jobs: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobDetail = createAsyncThunk(
  'jobs/fetchJobDetail',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      // Also trigger view increment asynchronously
      api.post(`/jobs/${jobId}/view`).catch(() => {});
      return response.data.data.job;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load job details');
    }
  }
);

export const createJobPost = createAsyncThunk(
  'jobs/createJobPost',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data.data.job;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create job');
    }
  }
);

export const updateJobPost = createAsyncThunk(
  'jobs/updateJobPost',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/jobs/${id}`, data);
      return response.data.data.job;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update job');
    }
  }
);

export const deleteJobPost = createAsyncThunk(
  'jobs/deleteJobPost',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/jobs/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete job');
    }
  }
);

export const fetchSavedJobs = createAsyncThunk(
  'jobs/fetchSavedJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/saved');
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch saved jobs');
    }
  }
);

export const toggleSaveJob = createAsyncThunk(
  'jobs/toggleSaveJob',
  async ({ jobId, isSaved }, { rejectWithValue }) => {
    try {
      if (isSaved) {
        await api.delete(`/saved/${jobId}`);
        return { jobId, isSaved: false };
      } else {
        await api.post('/saved', { jobId });
        return { jobId, isSaved: true };
      }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update bookmark');
    }
  }
);

export const submitApplication = createAsyncThunk(
  'jobs/submitApplication',
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await api.post('/applications', applicationData);
      return response.data.data.application;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit application');
    }
  }
);

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    currentJob: null,
    savedJobs: [],
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentJob: (state) => {
      state.currentJob = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload.jobs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Detail
      .addCase(fetchJobDetail.pending, (state) => {
        state.detailLoading = true;
      })
      .addCase(fetchJobDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentJob = action.payload;
      })
      .addCase(fetchJobDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Saved Jobs
      .addCase(fetchSavedJobs.fulfilled, (state, action) => {
        state.savedJobs = action.payload;
      })
      .addCase(toggleSaveJob.fulfilled, (state, action) => {
        const { jobId, isSaved } = action.payload;
        if (state.currentJob && state.currentJob._id === jobId) {
          state.currentJob.isSaved = isSaved;
        }
        if (!isSaved) {
          state.savedJobs = state.savedJobs.filter((sj) => sj.job?._id !== jobId);
        }
      })
      // Submit Application
      .addCase(submitApplication.fulfilled, (state, action) => {
        if (state.currentJob && state.currentJob._id === action.payload.job) {
          state.currentJob.hasApplied = true;
          state.currentJob.userApplication = action.payload;
        }
      });
  },
});

export const { clearCurrentJob } = jobSlice.actions;
export default jobSlice.reducer;
