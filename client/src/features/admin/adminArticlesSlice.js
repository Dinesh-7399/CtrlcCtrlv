// src/features/admin/adminArticlesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchAdminArticlesListAPI, // New
  fetchAdminArticleByIdAPI,
  createAdminArticleAPI,
  updateAdminArticleAPI,
  deleteAdminArticleAPI, // New
} from '../../services/adminArticleService.js'; // Adjust path
import { uploadFileAPI } from '../../services/uploadService.js';

// --- Thunks for Article List ---
export const fetchAdminArticlesList = createAsyncThunk(
  'adminArticles/fetchAdminArticlesList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminArticlesListAPI(params);
      if (apiResponse.success) {
        return apiResponse.data; // { articles, currentPage, totalPages, totalArticles }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message);
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Failed to fetch articles list.');
    }
  }
);

// Thunk to delete an article
export const deleteAdminArticle = createAsyncThunk(
  'adminArticles/deleteAdminArticle',
  async (articleId, { rejectWithValue, dispatch }) => {
    try {
      const apiResponse = await deleteAdminArticleAPI(articleId);
      if (apiResponse.success) {
        return articleId; // Return ID to remove from state
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message);
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Failed to delete article.');
    }
  }
);

// --- Thunks for Single Article Edit (from previous setup) ---
// Assuming these are defined elsewhere or were part of the "existing code" placeholder
export const fetchAdminArticle = createAsyncThunk(
    'adminArticles/fetchAdminArticle',
    async (articleId, { rejectWithValue }) => {
        try {
            const response = await fetchAdminArticleByIdAPI(articleId);
            if (response.success) return response.data.article;
            return rejectWithValue(response.message);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
export const createAdminArticle = createAsyncThunk(
    'adminArticles/createAdminArticle',
    async (articleData, { rejectWithValue }) => {
        try {
            const response = await createAdminArticleAPI(articleData);
            if (response.success) return response.data.article;
            return rejectWithValue(response.errors || response.message);
        } catch (error) {
            return rejectWithValue(error.errors || error.message);
        }
    }
);
export const updateAdminArticle = createAsyncThunk(
    'adminArticles/updateAdminArticle',
    async ({ articleId, articleData }, { rejectWithValue }) => {
        try {
            const response = await updateAdminArticleAPI(articleId, articleData);
            if (response.success) return response.data.article;
            return rejectWithValue(response.errors || response.message);
        } catch (error) {
            return rejectWithValue(error.errors || error.message);
        }
    }
);
export const uploadEditorImage = createAsyncThunk(
    'adminArticles/uploadEditorImage',
    async (file, { rejectWithValue }) => {
        try {
            const response = await uploadFileAPI(file, 'editorImage'); // 'editorImage' as fieldName
            if (response.success) return response.data.url; // URL of the uploaded image
            return rejectWithValue(response.message);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);
// --- End Thunks for Single Article Edit ---


const initialState = {
  // For Article List Page
  articlesList: [],
  listPagination: {
    currentPage: 1,
    totalPages: 0,
    totalArticles: 0,
  },
  listStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,

  // For Article Edit Page
  currentEditingArticle: null,
  editStatus: 'idle', // 'idle' | 'loading' | 'saving' | 'succeeded' | 'failed'
  editError: null,
  isUploadingImage: false,
  uploadError: null,
  saveSuccessMessage: '',
};

const adminArticlesSlice = createSlice({
  name: 'adminArticles',
  initialState,
  reducers: {
    clearAdminArticleState: (state) => { // For edit page
      state.currentEditingArticle = null;
      state.editStatus = 'idle';
      state.editError = null;
      state.saveSuccessMessage = '';
    },
    setSaveSuccessMessage: (state, action) => { state.saveSuccessMessage = action.payload; },
    clearSaveSuccessMessage: (state) => { state.saveSuccessMessage = ''; },
    clearAdminArticleError: (state) => { state.editError = null; }, // For edit page
    clearAdminArticleListError: (state) => { state.listError = null; } // For list page
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Articles List
      .addCase(fetchAdminArticlesList.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchAdminArticlesList.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.articlesList = action.payload.articles;
        state.listPagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          totalArticles: action.payload.totalArticles,
        };
      })
      .addCase(fetchAdminArticlesList.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload;
      })

      // Delete Admin Article
      .addCase(deleteAdminArticle.pending, (state) => {
        state.listStatus = 'loading'; // Or a specific 'deleting' status
      })
      .addCase(deleteAdminArticle.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.articlesList = state.articlesList.filter(article => article.id !== action.payload); // Use 'id' from backend
        state.listPagination.totalArticles -= 1;
        // Adjust totalPages if needed, or re-fetch list for simplicity
      })
      .addCase(deleteAdminArticle.rejected, (state, action) => {
        state.listStatus = 'failed'; // Revert loading status
        state.listError = action.payload; // Show deletion error
      })

      // Fetch Single Admin Article (for edit page)
      .addCase(fetchAdminArticle.pending, (state) => {
        state.editStatus = 'loading';
        state.currentEditingArticle = null;
        state.editError = null;
      })
      .addCase(fetchAdminArticle.fulfilled, (state, action) => {
        state.editStatus = 'succeeded';
        state.currentEditingArticle = action.payload;
      })
      .addCase(fetchAdminArticle.rejected, (state, action) => {
        state.editStatus = 'failed';
        state.editError = action.payload;
      })

      // Create Admin Article
      .addCase(createAdminArticle.pending, (state) => { state.editStatus = 'saving'; state.editError = null; state.saveSuccessMessage = ''; })
      .addCase(createAdminArticle.fulfilled, (state, action) => {
        state.editStatus = 'succeeded';
        state.saveSuccessMessage = 'Article created successfully!';
        // Optionally add to list if not redirecting immediately or add to list on list page load
      })
      .addCase(createAdminArticle.rejected, (state, action) => { state.editStatus = 'failed'; state.editError = action.payload; })

      // Update Admin Article (used for general update and status toggle)
      .addCase(updateAdminArticle.pending, (state) => { state.editStatus = 'saving'; /* For edit page */ state.listStatus = 'loading'; /* For list page status toggle */ state.editError = null; state.listError = null; state.saveSuccessMessage = ''; })
      .addCase(updateAdminArticle.fulfilled, (state, action) => {
        state.editStatus = 'succeeded'; // For edit page
        state.listStatus = 'succeeded'; // For list page
        state.saveSuccessMessage = 'Article updated successfully!';
        // Update in articlesList if it exists
        const index = state.articlesList.findIndex(article => article.id === action.payload.id);
        if (index !== -1) {
          state.articlesList[index] = { ...state.articlesList[index], ...action.payload };
        }
        // Update currentEditingArticle if it's the one being edited
        if (state.currentEditingArticle && state.currentEditingArticle.id === action.payload.id) {
          state.currentEditingArticle = action.payload;
        }
      })
      .addCase(updateAdminArticle.rejected, (state, action) => { state.editStatus = 'failed'; state.listStatus = 'failed'; state.editError = action.payload; state.listError = action.payload; })

      // Upload Editor Image
      .addCase(uploadEditorImage.pending, (state) => { state.isUploadingImage = true; state.uploadError = null; })
      .addCase(uploadEditorImage.fulfilled, (state) => { state.isUploadingImage = false; })
      .addCase(uploadEditorImage.rejected, (state, action) => { state.isUploadingImage = false; state.uploadError = action.payload; });
  },
});

export const { clearAdminArticleState, setSaveSuccessMessage, clearSaveSuccessMessage, clearAdminArticleError, clearAdminArticleListError } = adminArticlesSlice.actions;
export default adminArticlesSlice.reducer;

// Selectors
export const selectAdminArticlesList = (state) => state.adminArticles.articlesList;
export const selectAdminArticlesListStatus = (state) => state.adminArticles.listStatus;
export const selectAdminArticlesListError = (state) => state.adminArticles.listError;
export const selectAdminArticlesListPagination = (state) => state.adminArticles.listPagination;

export const selectCurrentEditingArticle = (state) => state.adminArticles.currentEditingArticle;
export const selectAdminArticleEditStatus = (state) => state.adminArticles.editStatus; // Combined loading/saving
export const selectAdminArticleEditError = (state) => state.adminArticles.editError;
export const selectAdminArticleSaveSuccessMessage = (state) => state.adminArticles.saveSuccessMessage;
export const selectIsUploadingEditorImage = (state) => state.adminArticles.isUploadingImage;
export const selectEditorImageUploadError = (state) => state.adminArticles.uploadError;

// The thunks are already exported individually when defined, so no need for the block export.
// Removed: export { fetchAdminArticle, createAdminArticle, updateAdminArticle, uploadEditorImage };