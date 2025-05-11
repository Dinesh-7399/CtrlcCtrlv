// src/features/testimonials/testimonialsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchVisibleTestimonialsAPI } from '../../services/testimonialService.js'; // Adjust path

// Renamed thunk to fetchTestimonials for consistency with how HomePage was trying to import it.
// However, if you prefer fetchVisibleTestimonials, ensure HomePage imports that exact name.
export const fetchVisibleTestimonials = createAsyncThunk(
  'testimonials/fetchVisibleTestimonials', // Action type string can remain
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchVisibleTestimonialsAPI();
      if (apiResponse.success) {
        return apiResponse.data.testimonials;
      } else {
        return rejectWithValue(apiResponse.message || 'Failed to fetch testimonials.');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'An unknown error occurred while fetching testimonials.');
    }
  }
);

const initialState = {
  testimonialsList: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const testimonialsSlice = createSlice({
  name: 'testimonials',
  initialState,
  reducers: {
    // Can add reducers like clearTestimonialsError if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisibleTestimonials.pending, (state) => { // Changed from fetchVisibleTestimonials
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchVisibleTestimonials.fulfilled, (state, action) => { // Changed from fetchVisibleTestimonials
        state.status = 'succeeded';
        state.testimonialsList = action.payload;
        state.error = null;
      })
      .addCase(fetchVisibleTestimonials.rejected, (state, action) => { // Changed from fetchVisibleTestimonials
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch testimonials.';
        state.testimonialsList = [];
      });
  },
});

export default testimonialsSlice.reducer;

// Selectors
// Exporting as selectAllTestimonials to match HomePage's import attempt
export const selectAllTestimonials = (state) => state.testimonials.testimonialsList;
// Exporting as selectTestimonialsStatus for consistency
export const selectTestimonialsStatus = (state) => state.testimonials.status;
export const selectTestimonialsError = (state) => state.testimonials.error;

// Original selectors if you prefer to use these names in HomePage:
// export const selectAllVisibleTestimonials = (state) => state.testimonials.testimonialsList;
// export const selectTestimonialsLoading = (state) => state.testimonials.isLoading; // isLoading was in your original slice