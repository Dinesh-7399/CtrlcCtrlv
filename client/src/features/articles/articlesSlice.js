// client/src/features/articles/articlesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getArticlesAPI, getArticleBySlugAPI } from '../../services/articleService.js';

const DEFAULT_ARTICLES_LIMIT = 9;

const initialState = {
  allArticles: [],
  currentArticleDetail: null,       // This will hold the single article object
  status: 'idle',                   // For list: 'idle' | 'loading' | 'succeeded' | 'failed'
  detailStatus: 'idle',             // For detail page: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,                      // Error for list operations
  detailError: null,                // Error for detail operations
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalArticles: 0,
    limit: DEFAULT_ARTICLES_LIMIT,
    activeFilters: { // This stores the current context for fetching lists
      tag: null,
      categorySlug: null,
      searchTerm: null,
      sortBy: 'publishedAt_desc', // Default sort order
    },
  },
};

// Thunk to fetch articles with filters (for articles list page)
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (filters = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState().articles;
      // Construct query filters, prioritizing explicitly passed filters,
      // then current active filters from state, then defaults.
      const queryFilters = {
        limit: filters.limit || state.pagination.limit || DEFAULT_ARTICLES_LIMIT,
        page: filters.page || 1, // Default to page 1 if not specified
        // For tag, categorySlug, searchTerm, sortBy: if a new value is passed in 'filters', use it.
        // Otherwise, use the value currently in state.pagination.activeFilters.
        tag: filters.tag !== undefined ? filters.tag : state.pagination.activeFilters.tag,
        categorySlug: filters.categorySlug !== undefined ? filters.categorySlug : state.pagination.activeFilters.categorySlug,
        searchTerm: filters.searchTerm !== undefined ? filters.searchTerm : state.pagination.activeFilters.searchTerm,
        sortBy: filters.sortBy || state.pagination.activeFilters.sortBy,
      };
      // console.log("articlesSlice (fetchArticles Thunk): Calling getArticlesAPI with filters:", queryFilters);
      const data = await getArticlesAPI(queryFilters);
      // console.log("articlesSlice (fetchArticles Thunk): Data received from service:", data);
      return { data, appliedFilters: queryFilters, requestedPage: queryFilters.page };
    } catch (error) {
      console.error("articlesSlice (fetchArticles Thunk): Error caught:", error.message);
      return rejectWithValue(error.message || 'Failed to fetch articles');
    }
  }
);

// Thunk to fetch a single article by its slug (for article detail page)
export const fetchArticleBySlug = createAsyncThunk(
  'articles/fetchArticleBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      // console.log(`articlesSlice (fetchArticleBySlug Thunk): Calling getArticleBySlugAPI for slug: ${slug}`);
      const dataFromService = await getArticleBySlugAPI(slug);

      console.log('articlesSlice (fetchArticleBySlug Thunk): Data from service to be returned to reducer:', JSON.stringify(dataFromService, null, 2));
      return dataFromService;
    } catch (error) {
      console.error(`articlesSlice (fetchArticleBySlug Thunk): Error caught for slug "${slug}":`, error.message);
      return rejectWithValue(error.message || `Failed to fetch article: ${slug}`);
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
    // This action resets the article list and can set new active filters
    resetArticlesList: (state, action) => {
      // console.log("articlesSlice (resetArticlesList): Resetting articles list. New filters:", action.payload?.newFilters);
      state.allArticles = []; // Clear existing articles
      state.status = 'idle';    // Set status to idle, ready for a new fetch
      state.error = null;       // Clear any previous list errors
      state.pagination = {
        ...initialState.pagination, // Reset pagination fields like currentPage, totalPages
        // Update activeFilters:
        // If action.payload.newFilters is provided, merge it with initial activeFilters.
        // This allows setting specific filters (e.g., a tag) while resetting others to default.
        // If no newFilters, activeFilters reset to their initial defaults.
        activeFilters: action.payload?.newFilters
          ? { ...initialState.pagination.activeFilters, ...action.payload.newFilters }
          : { ...initialState.pagination.activeFilters },
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Reducers for fetchArticles (List) ---
      .addCase(fetchArticles.pending, (state, action) => {
        state.status = 'loading';
        // Clear error only if it's a new context fetch (page 1 or filters changed implicitly)
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
                if (key !== 'page' && key !== 'limit' && key !== 'sortBy') { // Also exclude sortBy for this check, as it might change within a context
                    if (appliedFilters[key] !== state.pagination.activeFilters[key]) {
                        filtersActuallyChanged = true;
                        break;
                    }
                }
            }
        }
        // If it's the first page of a new filter context, or if core filters changed, replace articles.
        // The `resetArticlesList` action should ideally be dispatched before fetching with new core filters,
        // which would mean `state.allArticles` is already empty.
        if (requestedPage === 1 || (filtersActuallyChanged && state.allArticles.length > 0)) {
          state.allArticles = articles || [];
        } else {
          // Append for "Load More" functionality on subsequent pages of the same filter context
          const newArticles = (articles || []).filter(
            (newArt) => !state.allArticles.some((existingArt) => existingArt.id === newArt.id)
          );
          state.allArticles.push(...newArticles);
        }

        state.pagination.currentPage = currentPage !== undefined ? Number(currentPage) : 1;
        state.pagination.totalPages = totalPages !== undefined ? Number(totalPages) : 0;
        state.pagination.totalArticles = totalArticles !== undefined ? Number(totalArticles) : 0;
        if (limit !== undefined) state.pagination.limit = Number(limit);
        // Ensure activeFilters in pagination state accurately reflect the filters used for the current list
        if (appliedFilters) {
            state.pagination.activeFilters = {
                tag: appliedFilters.tag,
                categorySlug: appliedFilters.categorySlug,
                searchTerm: appliedFilters.searchTerm,
                sortBy: appliedFilters.sortBy, // Ensure sortBy is also updated here
            };
        }
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Reducers for fetchArticleBySlug (Detail) ---
      .addCase(fetchArticleBySlug.pending, (state) => {
        state.detailStatus = 'loading';
        state.detailError = null;
        state.currentArticleDetail = null;
      })
      .addCase(fetchArticleBySlug.fulfilled, (state, action) => {
        console.log('articlesSlice (fetchArticleBySlug.fulfilled): Action payload:', JSON.stringify(action.payload, null, 2));
        state.detailStatus = 'succeeded';
        state.currentArticleDetail = action.payload;
        state.detailError = null;
      })
      .addCase(fetchArticleBySlug.rejected, (state, action) => {
        console.error("articlesSlice (fetchArticleBySlug.rejected): Failed to fetch article. Error:", action.payload);
        state.detailStatus = 'failed';
        state.detailError = action.payload;
        state.currentArticleDetail = null;
      });
  },
});

export const {
  clearCurrentArticle,
  resetArticlesList, // This is the action you need
} = articlesSlice.actions;

// Selectors
export const selectAllArticles = (state) => state.articles.allArticles;
export const selectArticlesStatus = (state) => state.articles.status;
export const selectArticlesError = (state) => state.articles.error;
export const selectArticlesPagination = (state) => state.articles.pagination;
export const selectActiveFilters = (state) => state.articles.pagination.activeFilters; // Added selector for activeFilters

// Selectors for Article Detail
export const selectCurrentArticleDetails = (state) => state.articles.currentArticleDetail;
export const selectArticleDetailsStatus = (state) => state.articles.detailStatus;
export const selectArticleDetailsError = (state) => state.articles.detailError;

export default articlesSlice.reducer;