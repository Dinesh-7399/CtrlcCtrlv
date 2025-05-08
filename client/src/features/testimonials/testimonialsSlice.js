// src/features/testimonials/testimonialsSlice.js
import { createSlice, createSelector, createAsyncThunk } from '@reduxjs/toolkit';
import testimonialsData from '../../assets/dummyTestimonials.json'; // Adjust path if needed

// --- Simulate API Call Delay ---
const ARTIFICIAL_DELAY_MS = 600; // Another different delay

// --- Define the Initial State ---
// Start empty, fetch data async
const initialState = {
    items: [],         // Will be populated by the thunk
    status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- Create Async Thunk to Fetch Testimonials ---
export const fetchTestimonials = createAsyncThunk(
    'testimonials/fetchTestimonials',
    async (_, { rejectWithValue }) => {
        console.log("Redux Thunk: Simulating testimonial fetch...");
        await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

        try {
            // Simulate potential error (uncomment to test)
            // if (Math.random() > 0.5) { throw new Error('Simulated testimonial fetch error'); }

            // In a real app: const response = await axios.get('/api/testimonials'); return response.data;
            console.log("Redux Thunk: Simulated testimonial fetch SUCCEEDED.");
            return testimonialsData || []; // Return the imported data (or empty array)
        } catch (error) {
            console.error("Redux Thunk: Error during simulated testimonial fetch:", error);
            return rejectWithValue(error.message || 'Failed to fetch testimonials');
        }
    }
);

// --- Create the Slice ---
const testimonialsSlice = createSlice({
    name: 'testimonials',
    initialState,
    reducers: {
        // Add reducers later if needed (e.g., addTestimonial for admin)
    },
    // --- Handle Async Thunk Lifecycle ---
    extraReducers: (builder) => {
        builder
            .addCase(fetchTestimonials.pending, (state) => {
                console.log("Redux extraReducer: fetchTestimonials.pending");
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchTestimonials.fulfilled, (state, action) => {
                console.log("Redux extraReducer: fetchTestimonials.fulfilled");
                state.status = 'succeeded';
                state.items = action.payload; // Set items to the fetched array
                state.error = null;
            })
            .addCase(fetchTestimonials.rejected, (state, action) => {
                console.log("Redux extraReducer: fetchTestimonials.rejected");
                state.status = 'failed';
                state.error = action.payload || action.error.message || 'Unknown error fetching testimonials';
                state.items = []; // Clear items on failure
            });
    },
});

// --- Exports ---

// Export the reducer function
export default testimonialsSlice.reducer;

// Export the async thunk
// export { fetchTestimonials }; // Already exported above

// --- Selectors ---
export const selectAllTestimonials = (state) => state.testimonials?.items || [];

// Renamed for consistency and added error selector
export const selectTestimonialsStatus = (state) => state.testimonials?.status || 'idle';
export const selectTestimonialsError = (state) => state.testimonials?.error;

// Example: Selector to get a testimonial by ID (if needed)
export const selectTestimonialById = createSelector(
    selectAllTestimonials,
    (state, testimonialId) => testimonialId,
    (testimonials, testimonialId) => testimonials.find(t => t.id === testimonialId) || null
);