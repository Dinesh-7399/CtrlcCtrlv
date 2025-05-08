// src/features/articles/articlesSlice.js
import {
  createSlice,
  createSelector,
  createAsyncThunk,
} from "@reduxjs/toolkit";
// Adjust path if your dummyArticles.json is elsewhere
import articlesData from "../../assets/dummyArticles.json";

// --- Constants ---
const ARTIFICIAL_DELAY_MS = 1000; // Simulate 1 second delay

// --- Initial State ---
const initialState = {
  entities: {}, // Normalized data structure (articles stored by _id)
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null, // Stores error message if fetch fails
};

// --- Async Thunk for Fetching Articles ---
export const fetchArticles = createAsyncThunk(
  "articles/fetchArticles",
  async (_, { rejectWithValue }) => {
    // console.log("Redux Thunk: Simulating article fetch..."); // Keep for debugging if needed
    await new Promise((resolve) => setTimeout(resolve, ARTIFICIAL_DELAY_MS));
    try {
      // Uncomment to simulate a fetch error ~30% of the time
      // if (Math.random() > 0.7) {
      //     throw new Error('Simulated network error fetching articles');
      // }

      // Process raw data into a normalized entities map
      const entitiesMap = (articlesData || []).reduce((acc, article) => {
        if (article && article._id) {
          // Ensure a status field exists, default to 'published' if missing
          acc[article._id] = {
            ...article,
            status: article.status || "published",
          };
        } else {
          console.warn(
            "Skipping article data during fetch due to missing _id:",
            article
          );
        }
        return acc;
      }, {});

      // console.log("Redux Thunk: Simulated article fetch SUCCEEDED."); // Keep for debugging if needed
      return entitiesMap; // Payload for the 'fulfilled' action
    } catch (error) {
      console.error(
        "Redux Thunk: Error during simulated article fetch:",
        error
      );
      return rejectWithValue(error.message || "Failed to fetch articles"); // Payload for the 'rejected' action
    }
  }
);

// --- Slice Definition ---
const articlesSlice = createSlice({
  name: "articles",
  initialState,
  // Synchronous reducers
  reducers: {
    // Update an article (e.g., for status toggle)
    articleUpdated(state, action) {
      const { _id, changes } = action.payload;
      const existingArticle = state.entities[_id];
      if (existingArticle) {
        // Apply changes directly to the draft state (Immer handles immutability)
        Object.assign(existingArticle, changes);
        // console.log(`Redux: Updated article ${_id}`); // Keep for debugging if needed
      } else {
        console.warn(
          `articleUpdated reducer: Article with _id ${_id} not found.`
        );
      }
    },
    // --- ADDED: Reducer to delete an article ---
    removeArticle(state, action) {
      const articleIdToDelete = action.payload; // Expects the _id
      if (state.entities && state.entities[articleIdToDelete]) {
        delete state.entities[articleIdToDelete];
      } else {
        console.warn(
          `deleteArticle reducer: Article with _id ${articleIdToDelete} not found.`
        );
      }
    },
    // Define articleAdded later if needed
    // articleAdded: (state, action) => { ... },
  },
  // Handle async actions defined by createAsyncThunk
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.entities = action.payload; // Replace existing entities with fetched data
        state.error = null;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload ||
          action.error?.message ||
          "Unknown error fetching articles";
        // Keep existing data on fetch failure? Or clear? User choice.
        // state.entities = {}; // Optional: Clear on failure
      });
  },
});

// --- Selectors ---

// Base selector for the entities object
const selectArticleEntities = (state) => state.articles.entities;

// Select all articles as an array (memoized)
export const selectAllArticles = createSelector(
  [selectArticleEntities],
  (entities) => Object.values(entities || {})
);

// Select a single article by ID (memoized)
export const selectArticleById = createSelector(
  [selectArticleEntities, (state, articleId) => articleId],
  (entities, articleId) => (entities ? entities[articleId] : null)
);

// Select a single article by slug (memoized)
export const selectArticleBySlug = createSelector(
  [selectAllArticles, (state, slug) => slug],
  (articles, slug) => articles.find((article) => article.slug === slug) || null
);

// Selectors for status and error
export const selectArticlesStatus = (state) => state.articles.status;
export const selectArticlesError = (state) => state.articles.error;

// --- Exports ---

// Export ALL synchronous action creators generated by createSlice
export const { articleUpdated, removeArticle } = articlesSlice.actions; // Added deleteArticle

// Export the reducer as the default export
export default articlesSlice.reducer;

// Async thunk (fetchArticles) is already exported via 'export const'
