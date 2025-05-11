// src/features/admin/adminSettingsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchAdminPlatformSettingsAPI,
  updateAdminPlatformSettingsAPI,
} from '../../services/adminSettingsService.js'; // Adjust path

// Async thunk for fetching platform settings
export const fetchAdminSettings = createAsyncThunk(
  'adminSettings/fetchAdminSettings',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminPlatformSettingsAPI();
      if (apiResponse.success) {
        return apiResponse.data; // This is the settings object { key: value, ... }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message);
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Failed to fetch settings.');
    }
  }
);

// Async thunk for updating platform settings
export const updateAdminSettings = createAsyncThunk(
  'adminSettings/updateAdminSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const apiResponse = await updateAdminPlatformSettingsAPI(settingsData);
      if (apiResponse.success) {
        return apiResponse.data; // Returns the updated settings object
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message);
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Failed to update settings.');
    }
  }
);

// Define known setting keys and their defaults for the initial state
// This should align with KNOWN_SETTINGS in your backend adminSettingsController.js
const defaultSettings = {
  SITE_NAME: 'LMS Platform',
  SUPPORT_EMAIL: 'support@example.com',
  LOGO_URL: '/logo.png',
  PRIMARY_COLOR: '#0056d2',
  RAZORPAY_KEY_ID_TEST: '', // Will be fetched, default to empty
  // RAZORPAY_KEY_SECRET_TEST is write-only, not stored in Redux state.
  RAZORPAY_PAYMENT_MODE: 'test',
  // Add other settings with their defaults here
};


const initialState = {
  settings: { ...defaultSettings }, // Initialize with defaults
  isLoading: false,
  isSaving: false,
  error: null,
  successMessage: '',
};

const adminSettingsSlice = createSlice({
  name: 'adminSettings',
  initialState,
  reducers: {
    clearAdminSettingsMessages: (state) => {
      state.error = null;
      state.successMessage = '';
    },
    // If you need to update a single setting optimistically or locally
    // updateSingleSetting: (state, action) => {
    //   const { key, value } = action.payload;
    //   if (state.settings.hasOwnProperty(key)) {
    //     state.settings[key] = value;
    //   }
    // },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Settings
      .addCase(fetchAdminSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        // Merge fetched settings with defaults to ensure all keys are present
        state.settings = { ...defaultSettings, ...action.payload };
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Admin Settings
      .addCase(updateAdminSettings.pending, (state) => {
        state.isSaving = true;
        state.error = null;
        state.successMessage = '';
      })
      .addCase(updateAdminSettings.fulfilled, (state, action) => {
        state.isSaving = false;
        // Merge updated settings. Backend returns only updated ones.
        state.settings = { ...state.settings, ...action.payload };
        state.successMessage = 'Settings updated successfully!';
      })
      .addCase(updateAdminSettings.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminSettingsMessages } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;

// Selectors
export const selectAdminPlatformSettings = (state) => state.adminSettings.settings;
export const selectAdminSettingsIsLoading = (state) => state.adminSettings.isLoading;
export const selectAdminSettingsIsSaving = (state) => state.adminSettings.isSaving;
export const selectAdminSettingsError = (state) => state.adminSettings.error;
export const selectAdminSettingsSuccessMessage = (state) => state.adminSettings.successMessage;
