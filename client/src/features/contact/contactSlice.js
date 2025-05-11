// src/features/contact/contactSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submitContactFormAPI } from '../../services/contactService'; // Adjust path as needed

export const submitContactForm = createAsyncThunk(
  'contact/submitForm',
  async (formData, { rejectWithValue }) => {
    try {
      const apiResponse = await submitContactFormAPI(formData);
      if (apiResponse.success) {
        return apiResponse.message || 'Your message has been sent successfully!'; // Return success message
      }
      // If success is false but backend provides a message (e.g., validation error not caught by client)
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to send message.');
    } catch (error) {
      // error is already structured from the service call
      return rejectWithValue(error.errors || error.message || 'An unexpected error occurred.');
    }
  }
);

const initialState = {
  submissionStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  successMessage: null,
  error: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearContactStatus: (state) => {
      state.submissionStatus = 'idle';
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitContactForm.pending, (state) => {
        state.submissionStatus = 'loading';
        state.successMessage = null;
        state.error = null;
      })
      .addCase(submitContactForm.fulfilled, (state, action) => {
        state.submissionStatus = 'succeeded';
        state.successMessage = action.payload; // The success message from the thunk
        state.error = null;
      })
      .addCase(submitContactForm.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.error = action.payload; // The error payload from rejectWithValue
        state.successMessage = null;
      });
  },
});

export const { clearContactStatus } = contactSlice.actions;

// Selectors
export const selectContactSubmissionStatus = (state) => state.contact.submissionStatus;
export const selectContactSuccessMessage = (state) => state.contact.successMessage;
export const selectContactError = (state) => state.contact.error;

export default contactSlice.reducer;