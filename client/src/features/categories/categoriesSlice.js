// src/features/categories/categoriesSlice.js
import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import categoriesData from '../../assets/dummyCategories.json'; // Adjust path if needed

// --- Simulate API Call Delay ---
const ARTIFICIAL_DELAY_MS = 800; // Slightly different delay for variety

// --- Define the Initial State ---
// Start empty, fetch data async
const initialState = {
    items: [],         // Will be populated by the thunk
    status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- Create Async Thunk to Fetch Categories ---
export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (_, { rejectWithValue }) => {
        console.log("Redux Thunk: Simulating category fetch...");
        await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

        try {
            // Simulate potential error (uncomment to test)
            // if (Math.random() > 0.8) { throw new Error('Simulated category fetch error'); }

            // In a real app: const response = await axios.get('/api/categories'); return response.data;
            console.log("Redux Thunk: Simulated category fetch SUCCEEDED.");
            return categoriesData || []; // Return the imported data (or empty array)
        } catch (error) {
            console.error("Redux Thunk: Error during simulated category fetch:", error);
            return rejectWithValue(error.message || 'Failed to fetch categories');
        }
    }
);

// --- Create the Slice ---
const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        // Add synchronous reducers later if needed (e.g., addCategory, updateCategory)
    },
    // --- Handle Async Thunk Lifecycle ---
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                console.log("Redux extraReducer: fetchCategories.pending");
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                console.log("Redux extraReducer: fetchCategories.fulfilled");
                state.status = 'succeeded';
                state.items = action.payload; // Set items to the fetched array
                state.error = null;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                console.log("Redux extraReducer: fetchCategories.rejected");
                state.status = 'failed';
                state.error = action.payload || action.error.message || 'Unknown error fetching categories';
                state.items = []; // Clear items on failure
            });
    },
});

// --- Exports ---

// Export the reducer function
export default categoriesSlice.reducer;

// Export the async thunk
// export { fetchCategories }; // Already exported above

// --- Selectors ---
export const selectAllCategories = (state) => state.categories?.items || [];
export const selectCategoriesStatus = (state) => state.categories?.status;
export const selectCategoriesError = (state) => state.categories?.error;

// Example: Selector to find category by ID (if needed later)
export const selectCategoryById = createSelector(
    selectAllCategories,
    (state, categoryId) => categoryId,
    (categories, categoryId) => categories.find(cat => cat.id === categoryId) || null
);

// Example: Selector to find category by slug (if needed later)
export const selectCategoryBySlug = createSelector(
    selectAllCategories,
    (state, categorySlug) => categorySlug,
    (categories, categorySlug) => categories.find(cat => cat.slug === categorySlug) || null
);