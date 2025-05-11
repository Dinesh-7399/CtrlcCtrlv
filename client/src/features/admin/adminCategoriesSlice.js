import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// --- Import CORRECTED function names from your API service ---
import {
  fetchAdminCategoriesAPI,
  createAdminCategoryAPI,   // Correctly matches the service export
  updateAdminCategoryAPI,
  deleteAdminCategoryAPI
  // apiFetchAdminCategoryById // Optional: if you create this in your service
} from '../../services/adminCategoryService'; // ** ENSURE THIS PATH IS CORRECT **

// --- Initial State ---
const initialState = {
  categories: [],
  currentCategory: null,   // For editing or viewing a single category
  
  // For fetching all categories
  status: 'idle',          // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,             // Error message string for fetching all

  // For CUD (Create, Update, Delete) operations
  operationStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  operationError: null,    // Error message string for CUD operations
  operationMessage: null,  // Success message string for CUD operations
};

// --- Async Thunks ---

export const fetchAdminCategories = createAsyncThunk(
  'adminCategories/fetchAdminCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const responseData = await fetchAdminCategoriesAPI(params); // Using correct imported function
      if (responseData.success && responseData.data && Array.isArray(responseData.data.categories)) {
        return responseData.data.categories;
      } else if (responseData.success && Array.isArray(responseData.data)) {
        return responseData.data;
      }
      return rejectWithValue(responseData.message || 'Failed to fetch categories: Unexpected response structure.');
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred while fetching categories.';
      console.error('Thunk fetchAdminCategories error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const addAdminCategory = createAsyncThunk(
  'adminCategories/addAdminCategory',
  async (categoryData, { rejectWithValue }) => {
    try {
      // Using the CORRECTLY IMPORTED function name
      const responseData = await createAdminCategoryAPI(categoryData); 
      if (responseData.success && responseData.data && responseData.data.category) {
        return responseData.data.category;
      }
      return rejectWithValue(responseData.message || 'Failed to add category: Unexpected response structure.');
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred while adding the category.';
      console.error('Thunk addAdminCategory error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateAdminCategory = createAsyncThunk(
  'adminCategories/updateAdminCategory',
  async ({ categoryId, categoryData }, { rejectWithValue }) => {
    try {
      const responseData = await updateAdminCategoryAPI(categoryId, categoryData); // Using correct imported function
      if (responseData.success && responseData.data && responseData.data.category) {
        return responseData.data.category;
      }
      return rejectWithValue(responseData.message || 'Failed to update category: Unexpected response structure.');
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred while updating the category.';
      console.error('Thunk updateAdminCategory error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteAdminCategory = createAsyncThunk(
  'adminCategories/deleteAdminCategory',
  async (categoryId, { rejectWithValue }) => {
    try {
      const responseData = await deleteAdminCategoryAPI(categoryId); // Using correct imported function
      if (responseData.success) {
        return categoryId;
      }
      return rejectWithValue(responseData.message || 'Failed to delete category: Unexpected response structure.');
    } catch (error) {
      const errorMessage = error.message || 'An unknown error occurred while deleting the category.';
      console.error('Thunk deleteAdminCategory error:', errorMessage, error);
      return rejectWithValue(errorMessage);
    }
  }
);

// --- Slice Definition ---
const adminCategoriesSlice = createSlice({
  name: 'adminCategories',
  initialState,
  reducers: {
    clearAdminCategoryMessages: (state) => {
      state.operationStatus = 'idle';
      state.operationError = null;
      state.operationMessage = null;
    },
    setCurrentAdminCategoryForEdit: (state, action) => {
      if (typeof action.payload === 'string' || typeof action.payload === 'number') {
        state.currentCategory = state.categories.find(cat => String(cat.id) === String(action.payload)) || null;
      } else {
        state.currentCategory = action.payload;
      }
    },
    clearCurrentAdminCategoryForEdit: (state) => {
      state.currentCategory = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Categories
      .addCase(fetchAdminCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdminCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchAdminCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Add Admin Category
      .addCase(addAdminCategory.pending, (state) => {
        state.operationStatus = 'loading';
        state.operationError = null;
        state.operationMessage = null;
      })
      .addCase(addAdminCategory.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        state.categories.push(action.payload);
        state.operationMessage = 'Category added successfully!';
      })
      .addCase(addAdminCategory.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      })

      // Update Admin Category
      .addCase(updateAdminCategory.pending, (state) => {
        state.operationStatus = 'loading';
        state.operationError = null;
        state.operationMessage = null;
      })
      .addCase(updateAdminCategory.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        if (state.currentCategory && state.currentCategory.id === action.payload.id) {
            state.currentCategory = action.payload;
        }
        state.operationMessage = 'Category updated successfully!';
      })
      .addCase(updateAdminCategory.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      })

      // Delete Admin Category
      .addCase(deleteAdminCategory.pending, (state) => {
        state.operationStatus = 'loading';
        state.operationError = null;
        state.operationMessage = null;
      })
      .addCase(deleteAdminCategory.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        if (state.currentCategory && state.currentCategory.id === action.payload) {
            state.currentCategory = null;
        }
        state.operationMessage = 'Category deleted successfully!';
      })
      .addCase(deleteAdminCategory.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      });
  }
});

// --- Export Actions & Reducer ---
export const {
  clearAdminCategoryMessages,
  setCurrentAdminCategoryForEdit,
  clearCurrentAdminCategoryForEdit
} = adminCategoriesSlice.actions;

// --- Selectors ---
export const selectAllAdminCategories = (state) => state.adminCategories.categories;
export const selectAdminCategoriesStatus = (state) => state.adminCategories.status;
export const selectAdminCategoriesError = (state) => state.adminCategories.error;
export const selectAdminCategoryOperationStatus = (state) => state.adminCategories.operationStatus;
export const selectAdminCategoryOperationError = (state) => state.adminCategories.operationError;
export const selectAdminCategoryOperationMessage = (state) => state.adminCategories.operationMessage;
export const selectCurrentAdminCategoryBeingEdited = (state) => state.adminCategories.currentCategory;
export const selectAdminCategoryById = (state, categoryId) =>
  state.adminCategories.categories.find(category => String(category.id) === String(categoryId));

export default adminCategoriesSlice.reducer;