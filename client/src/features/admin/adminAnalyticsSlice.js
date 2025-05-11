// src/features/admin/adminAnalyticsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchAdminPlatformStatsAPI,
  fetchAdminUserTrendsAPI,
  fetchAdminEnrollmentOverviewAPI
} from '../../services/adminService.js'; // Adjust path if your service file is elsewhere

// Async thunk for fetching platform statistics
export const fetchPlatformStats = createAsyncThunk(
  'adminAnalytics/fetchPlatformStats',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminPlatformStatsAPI();
      if (apiResponse.success) {
        // Backend response.data is the stats object
        return apiResponse.data;
      } else {
        return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch platform stats.');
      }
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'An unknown error occurred while fetching platform stats.');
    }
  }
);

export const fetchUserTrends = createAsyncThunk(
  'adminAnalytics/fetchUserTrends',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminUserTrendsAPI();
      if (apiResponse.success) {
        return apiResponse.data.trends; // Assuming backend sends { trends: [...] }
      } else {
        return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch user trends.');
      }
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'An unknown error occurred while fetching user trends.');
    }
  }
);

export const fetchEnrollmentOverview = createAsyncThunk(
  'adminAnalytics/fetchEnrollmentOverview',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminEnrollmentOverviewAPI();
      if (apiResponse.success) {
        return apiResponse.data.overview; // Assuming backend sends { overview: [...] }
      } else {
        return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch enrollment overview.');
      }
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'An unknown error occurred while fetching enrollment overview.');
    }
  }
);


const initialState = {
  platformStats: {
    totalUsers: 0,
    totalPublishedCourses: 0, // Renamed from activeCourses to match backend
    draftCourses: 0,
    totalEnrollments: 0,
    recentRevenue: 0, // Renamed from monthlyRevenue
    newUsersLast7Days: 0, // Renamed from monthlyEnrollments for clarity if it's new users
    openDoubtsCount: 0,
    recentArticlesCount: 0,
  },
  userTrends: [], // For user registration chart
  enrollmentOverview: [], // For enrollment chart (e.g., by category)
  // Add other chart data states here: revenueBreakdown, etc.
  isLoadingStats: false,
  errorStats: null,
  isLoadingUserTrends: false,
  errorUserTrends: null,
  isLoadingEnrollmentOverview: false,
  errorEnrollmentOverview: null,
};

const adminAnalyticsSlice = createSlice({
  name: 'adminAnalytics',
  initialState,
  reducers: {
    // Standard reducers can go here if needed
  },
  extraReducers: (builder) => {
    builder
      // Platform Stats
      .addCase(fetchPlatformStats.pending, (state) => {
        state.isLoadingStats = true;
        state.errorStats = null;
      })
      .addCase(fetchPlatformStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.platformStats = action.payload; // action.payload is the stats object
        state.errorStats = null;
      })
      .addCase(fetchPlatformStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.errorStats = action.payload || 'Failed to load platform statistics.';
      })
      // User Trends
      .addCase(fetchUserTrends.pending, (state) => {
        state.isLoadingUserTrends = true;
        state.errorUserTrends = null;
      })
      .addCase(fetchUserTrends.fulfilled, (state, action) => {
        state.isLoadingUserTrends = false;
        state.userTrends = action.payload;
      })
      .addCase(fetchUserTrends.rejected, (state, action) => {
        state.isLoadingUserTrends = false;
        state.errorUserTrends = action.payload;
      })
      // Enrollment Overview
      .addCase(fetchEnrollmentOverview.pending, (state) => {
        state.isLoadingEnrollmentOverview = true;
        state.errorEnrollmentOverview = null;
      })
      .addCase(fetchEnrollmentOverview.fulfilled, (state, action) => {
        state.isLoadingEnrollmentOverview = false;
        state.enrollmentOverview = action.payload;
      })
      .addCase(fetchEnrollmentOverview.rejected, (state, action) => {
        state.isLoadingEnrollmentOverview = false;
        state.errorEnrollmentOverview = action.payload;
      });
  },
});

export default adminAnalyticsSlice.reducer;

// Selectors
export const selectPlatformStats = (state) => state.adminAnalytics.platformStats;
export const selectPlatformStatsLoading = (state) => state.adminAnalytics.isLoadingStats;
export const selectPlatformStatsError = (state) => state.adminAnalytics.errorStats;

export const selectUserTrends = (state) => state.adminAnalytics.userTrends;
export const selectUserTrendsLoading = (state) => state.adminAnalytics.isLoadingUserTrends;
export const selectUserTrendsError = (state) => state.adminAnalytics.errorUserTrends;

export const selectEnrollmentOverview = (state) => state.adminAnalytics.enrollmentOverview;
export const selectEnrollmentOverviewLoading = (state) => state.adminAnalytics.isLoadingEnrollmentOverview;
export const selectEnrollmentOverviewError = (state) => state.adminAnalytics.errorEnrollmentOverview;
