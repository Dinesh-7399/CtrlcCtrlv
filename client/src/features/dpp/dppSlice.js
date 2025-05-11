// src/features/dpp/dppSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { uploadFileAPI } from '../../services/uploadService'; // For file uploads
import { submitDppSolutionAPI, fetchDppDetailsAndSubmissionAPI } from '../../services/dppService';

// Thunk to fetch DPP details and any existing submission (Optional)
export const fetchDppDetails = createAsyncThunk(
  'dpp/fetchDetails',
  async ({ dppId }, { rejectWithValue }) => {
    try {
      const response = await fetchDppDetailsAndSubmissionAPI(dppId);
      if (response.success) {
        return response.data; // { dpp, submission (if any) }
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk for submitting DPP solution
export const submitDppSolution = createAsyncThunk(
  'dpp/submitSolution',
  async ({ courseId, lessonId, dppId, file, comments }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(setSubmissionStatus('uploadingFile'));
      // 1. Upload the file
      const uploadResponse = await uploadFileAPI(file, 'dppSolution'); // 'dppSolution' as fieldName
      if (!uploadResponse || !uploadResponse.success || !uploadResponse.data.url) {
        return rejectWithValue(uploadResponse.message || 'File upload failed.');
      }
      const fileUrl = uploadResponse.data.url;
      const originalFileName = file.name;

      // 2. Submit metadata (including file URL) to backend
      dispatch(setSubmissionStatus('submittingMetadata'));
      const submissionData = { courseId, lessonId, dppId, fileUrl, originalFileName, comments };
      const apiResponse = await submitDppSolutionAPI(submissionData);

      if (apiResponse.success) {
        return apiResponse; // { success: true, message: "...", data: { submission } }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'DPP submission failed.');
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Error submitting DPP solution.');
    }
  }
);

const initialState = {
  // currentDpp: null, // If fetching DPP details separately
  // existingSubmission: null, // For displaying prior submission
  // fetchStatus: 'idle',
  // fetchError: null,

  submissionStatus: 'idle', // 'idle' | 'uploadingFile' | 'submittingMetadata' | 'succeeded' | 'failed'
  submissionError: null,
  submissionSuccessMessage: null,
  lastSubmittedFile: null, // Store info about the last successfully submitted file
};

const dppSlice = createSlice({
  name: 'dpp',
  initialState,
  reducers: {
    clearDppState: (state) => {
      state.submissionStatus = 'idle';
      state.submissionError = null;
      state.submissionSuccessMessage = null;
      // state.currentDpp = null;
      // state.existingSubmission = null;
      // state.fetchStatus = 'idle';
      // state.fetchError = null;
    },
    setSubmissionStatus: (state, action) => { // Helper for multi-stage thunk
        state.submissionStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch DPP Details (Optional)
      // .addCase(fetchDppDetails.pending, (state) => { state.fetchStatus = 'loading'; })
      // .addCase(fetchDppDetails.fulfilled, (state, action) => {
      //   state.fetchStatus = 'succeeded';
      //   state.currentDpp = action.payload.dpp;
      //   state.existingSubmission = action.payload.submission;
      // })
      // .addCase(fetchDppDetails.rejected, (state, action) => { state.fetchStatus = 'failed'; state.fetchError = action.payload; })

      // Submit DPP Solution
      .addCase(submitDppSolution.pending, (state) => {
        // Status is set by dispatch(setSubmissionStatus()) within the thunk
        state.submissionError = null;
        state.submissionSuccessMessage = null;
      })
      .addCase(submitDppSolution.fulfilled, (state, action) => {
        state.submissionStatus = 'succeeded';
        state.submissionSuccessMessage = action.payload.message;
        state.lastSubmittedFile = action.payload.data?.submission; // Store submission details
        state.submissionError = null;
      })
      .addCase(submitDppSolution.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.submissionError = action.payload;
        state.submissionSuccessMessage = null;
      });
  },
});

export const { clearDppState, setSubmissionStatus } = dppSlice.actions;

// Selectors
// export const selectCurrentDppDetails = (state) => state.dpp.currentDpp;
// export const selectExistingDppSubmission = (state) => state.dpp.existingSubmission;
// export const selectDppFetchStatus = (state) => state.dpp.fetchStatus;
export const selectDppSubmissionStatus = (state) => state.dpp.submissionStatus;
export const selectDppSubmissionError = (state) => state.dpp.submissionError;
export const selectDppSuccessMessage = (state) => state.dpp.submissionSuccessMessage;
export const selectLastSubmittedDppFile = (state) => state.dpp.lastSubmittedFile;


export default dppSlice.reducer;