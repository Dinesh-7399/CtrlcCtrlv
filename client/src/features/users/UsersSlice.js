// src/features/users/UsersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  registerUserAPI,
  loginUserAPI,
  fetchCurrentUserAPI,
  logoutUserAPI,
  requestPasswordResetAPI,
  resetPasswordAPI,
  changePasswordAPI,       // From authService.js
  deleteAccountAPI,        // From authService.js
} from '../../services/authService.js'; // Ensure this path is correct

import {
  updateUserProfileAPI,
  fetchPublicUserProfileAPI,
  fetchNotificationPreferencesAPI, // From userService.js
  updateNotificationPreferencesAPI // From userService.js
} from '../../services/userService.js'; // Ensure this path is correct

// --- Auth Thunks ---
export const registerUser = createAsyncThunk(
  'users/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const apiResponse = await registerUserAPI(userData);
      if (apiResponse.success) return apiResponse.data.user;
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Registration failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'An unknown error occurred during registration.');
    }
  }
);

export const loginUser = createAsyncThunk(
  'users/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const apiResponse = await loginUserAPI(credentials);
      if (apiResponse.success) return apiResponse.data.user;
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Login failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'An unknown error occurred during login.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'users/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchCurrentUserAPI();
      if (apiResponse.success) return apiResponse.data.user; // Backend should include notificationPreferences
      return rejectWithValue(apiResponse.message || 'Failed to fetch current user.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'No active session or failed to fetch user.');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'users/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await logoutUserAPI();
      if (apiResponse.success) return true;
      return rejectWithValue(apiResponse.message || 'Logout failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred during logout.');
    }
  }
);

// --- Profile Thunks ---
export const updateUserProfile = createAsyncThunk(
  'users/updateUserProfile',
  async (profileUpdateData, { rejectWithValue }) => {
    try {
      const apiResponse = await updateUserProfileAPI(profileUpdateData);
      if (apiResponse.success) return apiResponse.data.user; // Assuming API returns the updated user object
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Profile update failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'An unknown error occurred during profile update.');
    }
  }
);

export const fetchPublicUserProfile = createAsyncThunk(
  'users/fetchPublicUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchPublicUserProfileAPI(userId);
      if (apiResponse.success) return apiResponse.data.profile;
      return rejectWithValue(apiResponse.message || 'Failed to fetch public profile.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'An unknown error occurred while fetching public profile.');
    }
  }
);

// --- Password Reset Thunks ---
export const requestPasswordReset = createAsyncThunk(
  'users/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      const apiResponse = await requestPasswordResetAPI(email);
      if (apiResponse.success) return apiResponse.message;
      return rejectWithValue(apiResponse.message || 'Password reset request failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Password reset request failed.');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'users/resetPassword',
  async ({ token, passwordData }, { rejectWithValue }) => {
    try {
      const apiResponse = await resetPasswordAPI(token, passwordData);
      if (apiResponse.success) return apiResponse.message;
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Password reset failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'Password reset failed.');
    }
  }
);

// --- Settings Page Thunks ---
export const changePassword = createAsyncThunk(
  'users/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const apiResponse = await changePasswordAPI(passwordData);
      if (apiResponse.success) return apiResponse.message || 'Password changed successfully.';
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Password change failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'Error changing password.');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'users/fetchNotifications',
  async (_, { getState, rejectWithValue }) => {
    try {
      const apiResponse = await fetchNotificationPreferencesAPI();
      if (apiResponse.success) return apiResponse.data.preferences;
      return rejectWithValue(apiResponse.message || 'Failed to fetch notification preferences.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Error fetching notification preferences.');
    }
  }
);

export const updateNotifications = createAsyncThunk(
  'users/updateNotifications',
  async (preferencesData, { dispatch, rejectWithValue }) => {
    try {
      const apiResponse = await updateNotificationPreferencesAPI(preferencesData);
      if (apiResponse.success) {
        dispatch(updateCurrentUserPreferences(apiResponse.data.preferences));
        return { message: apiResponse.message || "Preferences updated!", preferences: apiResponse.data.preferences };
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to update preferences.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'Error updating preferences.');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'users/deleteAccount',
  async (passwordConfirmation, { dispatch, rejectWithValue }) => {
    try {
      const apiResponse = await deleteAccountAPI({ password: passwordConfirmation });
      if (apiResponse.success) {
        await dispatch(logoutUser()).unwrap();
        return apiResponse.message || 'Account deleted successfully.';
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Account deletion failed.');
    } catch (error) {
      return rejectWithValue(error.response?.data?.errors || error.response?.data?.message || error.message || 'Error deleting account.');
    }
  }
);

const initialState = {
  currentUser: null,
  isAuthenticated: false,
  token: null,
  loading: {
    auth: false,
    profile: false,
    publicProfile: false,
    passwordReset: false,
    passwordChange: false,
    notifications: false,
    accountDelete: false,
  },
  error: {
    auth: null,
    profile: null,
    publicProfile: null,
    passwordReset: null,
    passwordChange: null,
    notifications: null,
    accountDelete: null,
  },
  message: {
    profile: null, // Added for profile success messages
    passwordChange: null,
    notifications: null,
    accountDelete: null,
    passwordReset: null,
  },
  viewedUserProfile: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    manualLogout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      state.token = null;
      Object.keys(state.loading).forEach(key => state.loading[key] = false);
      Object.keys(state.error).forEach(key => state.error[key] = null);
      Object.keys(state.message).forEach(key => state.message[key] = null);
      state.viewedUserProfile = null;
    },
    clearAuthError: (state) => {
      state.error.auth = null;
    },
    clearMessagesForSettings: (state) => {
        state.error.profile = null; state.message.profile = null; // Added profile message clearing
        state.error.passwordChange = null; state.message.passwordChange = null;
        state.error.notifications = null;  state.message.notifications = null;
        state.error.accountDelete = null;  state.message.accountDelete = null;
    },
    clearPasswordResetMessages: (state) => {
        state.message.passwordReset = null;
        state.error.passwordReset = null;
    },
    clearViewedUserProfile: (state) => {
        state.viewedUserProfile = null;
        state.loading.publicProfile = false;
        state.error.publicProfile = null;
    },
    updateCurrentUserPreferences: (state, action) => {
        if(state.currentUser) {
            state.currentUser.notificationPreferences = action.payload;
        }
    }
  },
  extraReducers: (builder) => {
    builder
      // Auth
      .addCase(registerUser.pending, (state) => { state.loading.auth = true; state.error.auth = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading.auth = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.error.auth = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading.auth = false;
        state.error.auth = action.payload;
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => { state.loading.auth = true; state.error.auth = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading.auth = false;
        state.currentUser = action.payload;
        state.isAuthenticated = true;
        state.error.auth = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading.auth = false;
        state.error.auth = action.payload;
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(fetchCurrentUser.pending, (state) => { state.loading.auth = true; state.error.auth = null; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading.auth = false;
        state.currentUser = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error.auth = null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading.auth = false;
        state.error.auth = action.payload;
        state.currentUser = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.pending, (state) => { state.loading.auth = true; })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading.auth = false;
        state.currentUser = null;
        state.isAuthenticated = false;
        state.token = null;
        state.error.auth = null;
        Object.keys(state.message).forEach(key => state.message[key] = null);
        state.viewedUserProfile = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading.auth = false;
        state.error.auth = action.payload;
        state.currentUser = null;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Profile
      .addCase(updateUserProfile.pending, (state) => { state.loading.profile = true; state.error.profile = null; state.message.profile = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading.profile = false;
        state.message.profile = "Profile updated successfully!"; // Set a generic success message
        if (state.currentUser && state.currentUser.id === action.payload.id) {
          const existingPrefs = state.currentUser.notificationPreferences;
          state.currentUser = { ...state.currentUser, ...action.payload };
          if(existingPrefs && !action.payload.notificationPreferences && state.currentUser) {
              state.currentUser.notificationPreferences = existingPrefs;
          }
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => { state.loading.profile = false; state.error.profile = action.payload; state.message.profile = null; })
      .addCase(fetchPublicUserProfile.pending, (state) => { state.loading.publicProfile = true; state.error.publicProfile = null; state.viewedUserProfile = null; })
      .addCase(fetchPublicUserProfile.fulfilled, (state, action) => {
        state.loading.publicProfile = false;
        state.viewedUserProfile = action.payload;
      })
      .addCase(fetchPublicUserProfile.rejected, (state, action) => {
        state.loading.publicProfile = false;
        state.error.publicProfile = action.payload;
        state.viewedUserProfile = null;
      })
      // Password Reset
      .addCase(requestPasswordReset.pending, (state) => { state.loading.passwordReset = true; state.error.passwordReset = null; state.message.passwordReset = null; })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.loading.passwordReset = false;
        state.message.passwordReset = action.payload;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => { state.loading.passwordReset = false; state.error.passwordReset = action.payload; })
      .addCase(resetPassword.pending, (state) => { state.loading.passwordReset = true; state.error.passwordReset = null; state.message.passwordReset = null; })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading.passwordReset = false;
        state.message.passwordReset = action.payload;
      })
      .addCase(resetPassword.rejected, (state, action) => { state.loading.passwordReset = false; state.error.passwordReset = action.payload; })
      // Settings: Change Password
      .addCase(changePassword.pending, (state) => { state.loading.passwordChange = true; state.error.passwordChange = null; state.message.passwordChange = null;})
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading.passwordChange = false;
        state.message.passwordChange = action.payload;
      })
      .addCase(changePassword.rejected, (state, action) => { state.loading.passwordChange = false; state.error.passwordChange = action.payload; })
      // Settings: Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => { state.loading.notifications = true; state.error.notifications = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        if (state.currentUser && action.payload) {
          state.currentUser.notificationPreferences = action.payload;
        }
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading.notifications = false; state.error.notifications = action.payload; })
      // Settings: Update Notifications
      .addCase(updateNotifications.pending, (state) => { state.loading.notifications = true; state.error.notifications = null; state.message.notifications = null; })
      .addCase(updateNotifications.fulfilled, (state, action) => {
        state.loading.notifications = false;
        state.message.notifications = action.payload.message;
      })
      .addCase(updateNotifications.rejected, (state, action) => { state.loading.notifications = false; state.error.notifications = action.payload; })
      // Settings: Delete Account
      .addCase(deleteAccount.pending, (state) => { state.loading.accountDelete = true; state.error.accountDelete = null; state.message.accountDelete = null; })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading.accountDelete = false;
        state.message.accountDelete = action.payload;
      })
      .addCase(deleteAccount.rejected, (state, action) => { state.loading.accountDelete = false; state.error.accountDelete = action.payload; });
  },
});

export const {
    manualLogout,
    clearAuthError,
    clearPasswordResetMessages,
    clearViewedUserProfile,
    clearMessagesForSettings,
    updateCurrentUserPreferences,
} = usersSlice.actions;

export default usersSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.users.currentUser;
export const selectIsAuthenticated = (state) => state.users.isAuthenticated;
export const selectAuthLoading = (state) => state.users.loading.auth;
export const selectAuthError = (state) => state.users.error.auth;

export const selectProfileLoading = (state) => state.users.loading.profile;
export const selectProfileError = (state) => state.users.error.profile;
export const selectProfileMessage = (state) => state.users.message.profile; // Added selector for profile messages

export const selectViewedUserProfile = (state) => state.users.viewedUserProfile;
export const selectPublicProfileLoading = (state) => state.users.loading.publicProfile;
export const selectPublicProfileError = (state) => state.users.error.publicProfile;

export const selectPasswordResetMessage = (state) => state.users.message.passwordReset;
export const selectPasswordResetLoading = (state) => state.users.loading.passwordReset;
export const selectPasswordResetError = (state) => state.users.error.passwordReset;

export const selectPasswordChangeLoading = (state) => state.users.loading.passwordChange;
export const selectPasswordChangeError = (state) => state.users.error.passwordChange;
export const selectPasswordChangeMessage = (state) => state.users.message.passwordChange;

export const selectNotificationPrefsLoading = (state) => state.users.loading.notifications;
export const selectNotificationPrefsError = (state) => state.users.error.notifications;
export const selectNotificationPrefsMessage = (state) => state.users.message.notifications;
export const selectNotificationPrefs = (state) => state.users.currentUser?.notificationPreferences || null;

export const selectAccountDeleteLoading = (state) => state.users.loading.accountDelete;
export const selectAccountDeleteError = (state) => state.users.error.accountDelete;
export const selectAccountDeleteMessage = (state) => state.users.message.accountDelete;

export const selectUserById = (state, userId) => {
  if (state.users.currentUser && state.users.currentUser.id === userId) {
    return state.users.currentUser;
  }
  if (state.users.viewedUserProfile && state.users.viewedUserProfile.id === userId) {
    return state.users.viewedUserProfile;
  }
  return null;
};