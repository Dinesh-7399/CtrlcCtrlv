// src/features/platform/platformSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPublicPlatformStatsAPI } from '../../services/platformService'; // Adjust path

export const fetchPublicStats = createAsyncThunk(
  'platform/fetchPublicStats',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchPublicPlatformStatsAPI();
      if (apiResponse.success) {
        return apiResponse.data; // e.g., { totalUsers, totalInstructors, totalCourses, totalCategories }
      }
      return rejectWithValue(apiResponse.message || 'Could not fetch platform stats.');
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching platform stats.');
    }
  }
);

const initialState = {
  stats: {
    totalUsers: 0,
    totalInstructors: 0,
    totalCourses: 0,    // Can also be derived from coursesSlice.courses.length
    totalCategories: 0, // Can also be derived from categoriesSlice.categoriesList.length
    // Add other public stats as needed
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const platformSlice = createSlice({
  name: 'platform',
  initialState,
  reducers: {
    // You can add other reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPublicStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = { ...state.stats, ...action.payload }; // Merge fetched stats
      })
      .addCase(fetchPublicStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectPlatformStats = (state) => state.platform.stats;
export const selectPlatformStatsStatus = (state) => state.platform.status;
export const selectPlatformStatsError = (state) => state.platform.error;

export default platformSlice.reducer;