// src/features/categories/categoriesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCategoriesAPI, fetchCategoryByIdentifierAPI } from '../../services/categoryServices.js'; // Path corrected in previous step

export const fetchAllCategories = createAsyncThunk(
  'categories/fetchAllCategories',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchCategoriesAPI();
      if (apiResponse.success) {
        return apiResponse.data.categories;
      } else {
        return rejectWithValue(apiResponse.message || 'Failed to fetch categories.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'An unknown error occurred while fetching categories.');
    }
  }
);

export const fetchCategoryDetails = createAsyncThunk(
  'categories/fetchCategoryDetails',
  async (identifier, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchCategoryByIdentifierAPI(identifier);
      if (apiResponse.success) {
        return apiResponse.data.category;
      } else {
        return rejectWithValue(apiResponse.message || 'Failed to fetch category details.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'An unknown error occurred while fetching category details.');
    }
  }
);

const initialState = {
  categoriesList: [],
  status: 'idle', // Changed from isLoadingList to a status enum
  error: null,    // Changed from errorList

  currentCategory: null,
  detailsStatus: 'idle', // Changed from isLoadingDetails
  detailsError: null,    // Changed from errorDetails
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
      state.detailsStatus = 'idle';
      state.detailsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handling fetchAllCategories
      .addCase(fetchAllCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categoriesList = action.payload;
        state.error = null;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch categories.';
        state.categoriesList = [];
      })
      // Handling fetchCategoryDetails
      .addCase(fetchCategoryDetails.pending, (state) => {
        state.detailsStatus = 'loading';
        state.detailsError = null;
        state.currentCategory = null;
      })
      .addCase(fetchCategoryDetails.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.currentCategory = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchCategoryDetails.rejected, (state, action) => {
        state.detailsStatus = 'failed';
        state.detailsError = action.payload || 'Failed to fetch category details.';
        state.currentCategory = null;
      });
  },
});

export const { clearCurrentCategory } = categoriesSlice.actions;
export default categoriesSlice.reducer;

// Selectors - Ensure these are what HomePage.jsx and other components will use
export const selectAllCategories = (state) => state.categories.categoriesList; // EXPORTING AS selectAllCategories
export const selectCategoriesStatus = (state) => state.categories.status;     // EXPORTING AS selectCategoriesStatus
export const selectCategoriesError = (state) => state.categories.error;

export const selectCurrentCategoryDetails = (state) => state.categories.currentCategory;
export const selectCategoryDetailsStatus = (state) => state.categories.detailsStatus; // EXPORTING AS selectCategoryDetailsStatus
export const selectCategoryDetailsError = (state) => state.categories.detailsError;

// The thunk fetchAllCategories is already exported by name.