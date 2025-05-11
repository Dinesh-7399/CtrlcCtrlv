// client/src/features/admin/adminUsersSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
// Ensure this path and the function names are correct for your adminUserService.js
import {
  fetchAdminUsersListAPI,
  updateAdminUserAPI,
  deleteAdminUserAPI
} from '../../services/adminUserService.js'; // Verify this path and service file exist

// Thunk to fetch users for the admin list
export const fetchAdminUsers = createAsyncThunk(
  'adminUsers/fetchAdminUsers',
  async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminUsersListAPI(params);
      if (apiResponse.success) {
        // Expected data: { users, currentPage, totalPages, totalUsers }
        return apiResponse.data;
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch admin users list.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error fetching admin users list.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Thunk to update a user (e.g., role, status) by an admin
export const updateAdminUser = createAsyncThunk(
  'adminUsers/updateAdminUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      const apiResponse = await updateAdminUserAPI(userId, userData);
      if (apiResponse.success) {
        return apiResponse.data.user; // Return the updated user
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to update user.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error updating user.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Thunk to delete a user by an admin
export const deleteAdminUser = createAsyncThunk(
  'adminUsers/deleteAdminUser',
  async (userId, { rejectWithValue }) => {
    try {
      const apiResponse = await deleteAdminUserAPI(userId);
      if (apiResponse.success) {
        return userId; // Return ID of deleted user to remove from state
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to delete user.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error deleting user.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);


const initialState = {
  usersList: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' for the list
  error: null,    // Error for the list
  operationStatus: 'idle', // For update/delete operations
  operationError: null,
};

const adminUsersSlice = createSlice({
  name: 'adminUsers', // This key must match what's used in store.js reducer map
  initialState,
  reducers: {
    clearAdminUsersError: (state) => {
        state.error = null;
        state.operationError = null;
    },
    resetAdminUsersStatus: (state) => {
        state.status = 'idle';
        state.operationStatus = 'idle';
    },
    // Example: if you need to manually set a user for some reason (e.g., after creation if not re-fetching list)
    // addUserToList: (state, action) => {
    //   state.usersList.unshift(action.payload); // Add to the beginning
    //   state.pagination.totalUsers +=1;
    // },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Users List
      .addCase(fetchAdminUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.usersList = action.payload.users || [];
        state.pagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 1,
          totalUsers: action.payload.totalUsers || 0,
        };
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.usersList = [];
        state.pagination = initialState.pagination;
      })

      // Update Admin User
      .addCase(updateAdminUser.pending, (state) => {
        state.operationStatus = 'loading';
        state.operationError = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const index = state.usersList.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.usersList[index] = action.payload;
        }
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      })

      // Delete Admin User
      .addCase(deleteAdminUser.pending, (state) => {
        state.operationStatus = 'loading';
        state.operationError = null;
      })
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        state.usersList = state.usersList.filter(user => user.id !== action.payload);
        state.pagination.totalUsers = Math.max(0, state.pagination.totalUsers - 1);
        // Consider if totalPages needs recalculation or if a list refetch is preferred
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      });
  },
});

export const { clearAdminUsersError, resetAdminUsersStatus } = adminUsersSlice.actions;

// --- Selectors ---
const selectAdminUsersState = (state) => state.adminUsers; // Base selector

export const selectAdminUsersList = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.usersList || [] // Robust selector
);

export const selectAdminUsersPagination = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.pagination || { currentPage: 1, totalPages: 1, totalUsers: 0 } // Robust
);

export const selectAdminUsersStatus = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.status || 'idle' // Robust
);

export const selectAdminUsersError = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.error || null // Robust
);

export const selectAdminUserOperationStatus = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.operationStatus || 'idle'
);

export const selectAdminUserOperationError = createSelector(
  [selectAdminUsersState],
  (adminUsers) => adminUsers?.operationError || null
);


export default adminUsersSlice.reducer;