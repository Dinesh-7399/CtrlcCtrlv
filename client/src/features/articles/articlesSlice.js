// client/src/features/articles/articlesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getArticlesAPI, getArticleBySlugAPI } from '../../services/articleService.js';

const DEFAULT_ARTICLES_LIMIT = 9;

const initialState = {
  allArticles: [],
  currentArticleDetail: null,
  status: 'idle',
  detailStatus: 'idle',
  error: null, // Will store { message, details? }
  detailError: null, // Will store { message, details? }
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalArticles: 0,
    limit: DEFAULT_ARTICLES_LIMIT,
    activeFilters: {
      tag: null,
      categorySlug: null,
      searchTerm: null,
      sortBy: 'publishedAt_desc',
    },
  },
};

export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (filters = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().articles;
      const queryFilters = {
        limit: filters.limit || state.pagination.limit || DEFAULT_ARTICLES_LIMIT,
        page: filters.page || 1,
        tag: filters.tag !== undefined ? filters.tag : state.pagination.activeFilters.tag,
        categorySlug: filters.categorySlug !== undefined ? filters.categorySlug : state.pagination.activeFilters.categorySlug,
        searchTerm: filters.searchTerm !== undefined ? filters.searchTerm : state.pagination.activeFilters.searchTerm,
        sortBy: filters.sortBy || state.pagination.activeFilters.sortBy,
      };
      const data = await getArticlesAPI(queryFilters);
      return { data, appliedFilters: queryFilters, requestedPage: queryFilters.page };
    } catch (error) {
      console.error("articlesSlice (fetchArticles Thunk): Error caught:", error.message, error.details);
      return rejectWithValue({
        message: error.message || 'Failed to fetch articles from slice',
        details: error.details || null
      });
    }
  }
);

export const fetchArticleBySlug = createAsyncThunk(
  'articles/fetchArticleBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const dataFromService = await getArticleBySlugAPI(slug); // Expects { article: {...} }
      if (dataFromService && dataFromService.article) {
        return dataFromService.article;
      } else {
        console.error(`articlesSlice (fetchArticleBySlug Thunk): Unexpected data for slug "${slug}":`, dataFromService);
        return rejectWithValue({ message: `Unexpected data structure for article: ${slug}` });
      }
    } catch (error) {
      console.error(`articlesSlice (fetchArticleBySlug Thunk): Error for slug "${slug}":`, error.message, error.details);
      return rejectWithValue({
        message: error.message || `Failed to fetch article: ${slug} from slice`,
        details: error.details || null
      });
    }
  }
);

const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearCurrentArticle: (state) => {
      state.currentArticleDetail = null;
      state.detailStatus = 'idle';
      state.detailError = null;
    },
    resetArticlesList: (state, action) => {
      state.allArticles = [];
      state.status = 'idle';
      state.error = null;
      state.pagination = {
        ...initialState.pagination,
        activeFilters: action.payload?.newFilters
          ? { ...initialState.pagination.activeFilters, ...action.payload.newFilters }
          : { ...initialState.pagination.activeFilters },
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state, action) => {
        state.status = 'loading';
        if (!action.meta.arg.page || action.meta.arg.page === 1) {
          state.error = null;
        }
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const responseData = action.payload.data || {};
        const { articles, currentPage, totalPages, totalArticles, limit } = responseData;
        const { appliedFilters, requestedPage } = action.payload;

        let filtersActuallyChanged = false;
        if (appliedFilters) {
            for (const key in appliedFilters) {
                if (key !== 'page' && key !== 'limit' && key !== 'sortBy') {
                    if (String(appliedFilters[key] || '') !== String(state.pagination.activeFilters[key] || '')) { // More robust comparison
                        filtersActuallyChanged = true;
                        break;
                    }
                }
            }
        }
        
        if (requestedPage === 1 || (filtersActuallyChanged && state.allArticles.length > 0)) {
          state.allArticles = articles || [];
        } else {
          const newArticles = (articles || []).filter(
            (newArt) => !state.allArticles.some((existingArt) => existingArt.id === newArt.id)
          );
          state.allArticles.push(...newArticles);
        }

        state.pagination.currentPage = currentPage !== undefined ? Number(currentPage) : 1;
        state.pagination.totalPages = totalPages !== undefined ? Number(totalPages) : 0;
        state.pagination.totalArticles = totalArticles !== undefined ? Number(totalArticles) : 0;
        if (limit !== undefined) state.pagination.limit = Number(limit);
        if (appliedFilters) {
            state.pagination.activeFilters = {
                tag: appliedFilters.tag || null, // Ensure null if undefined
                categorySlug: appliedFilters.categorySlug || null,
                searchTerm: appliedFilters.searchTerm || null,
                sortBy: appliedFilters.sortBy || initialState.pagination.activeFilters.sortBy,
            };
        }
        state.error = null;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchArticleBySlug.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
        state.currentArticleDetail = null;
      })
      .addCase(fetchArticleBySlug.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded';
        state.currentArticleDetail = action.payload;
        state.detailError = null;
      })
      .addCase(fetchArticleBySlug.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.detailError = action.payload;
        state.currentArticleDetail = null;
      });
  },
});

export const { clearCurrentArticle, resetArticlesList } = articlesSlice.actions;

export const selectAllArticles = (state) => state.articles.allArticles;
export const selectArticlesStatus = (state) => state.articles.status;
export const selectArticlesError = (state) => state.articles.error;
export const selectArticlesPagination = (state) => state.articles.pagination;
export const selectActiveFilters = (state) => state.articles.pagination.activeFilters;
export const selectCurrentArticleDetails = (state) => state.articles.currentArticleDetail;
export const selectArticleDetailsStatus = (state) => state.articles.detailStatus;
export const selectArticleDetailsError = (state) => state.articles.detailError;

export default articlesSlice.reducer;