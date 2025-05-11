// src/features/qna/qnaSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchQuestionsAPI, postQuestionAPI } from '../../services/qnaService'; // Path should be correct

export const fetchQuestions = createAsyncThunk(
  'qna/fetchQuestions',
  async (params = {}, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchQuestionsAPI(params);
      if (apiResponse.success) {
        return apiResponse.data; // Expects { questions, currentPage, totalPages, totalQuestions }
      }
      return rejectWithValue(apiResponse.message || 'Could not fetch questions.');
    } catch (error) {
      return rejectWithValue(error.message || 'Error fetching questions.');
    }
  }
);

export const askNewQuestion = createAsyncThunk(
  'qna/askNewQuestion',
  async (questionData, { dispatch, rejectWithValue }) => {
    try {
      const apiResponse = await postQuestionAPI(questionData);
      if (apiResponse.success) {
        // Consider dispatching fetchQuestions or an action to add to list if immediate update is needed
        return apiResponse.data.question; // Return the newly created question
      }
      // Ensure backend sends `errors` or `message` consistently on failure
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Could not post question.');
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Error posting question.');
    }
  }
);

const initialState = {
  questionsList: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalQuestions: 0,
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  askQuestionStatus: 'idle',
  askQuestionError: null,
};

const qnaSlice = createSlice({
  name: 'qna', // This name is used to generate action types, not for state key directly
  initialState,
  reducers: {
    clearQnAState: (state) => {
      state.questionsList = [];
      state.pagination = { ...initialState.pagination }; // Reset to initial pagination
      state.status = 'idle';
      state.error = null;
    },
    clearAskQuestionStatus: (state) => {
        state.askQuestionStatus = 'idle';
        state.askQuestionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Questions
      .addCase(fetchQuestions.pending, (state) => {
        state.status = 'loading';
        state.error = null; // Clear previous errors on new fetch attempt
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.questionsList = action.payload.questions;
        state.pagination = {
          currentPage: Number(action.payload.currentPage), // Ensure numbers
          totalPages: Number(action.payload.totalPages),
          totalQuestions: Number(action.payload.totalQuestions),
        };
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        // state.questionsList = []; // Consider if you always want to clear list on error
      })
      // Ask New Question
      .addCase(askNewQuestion.pending, (state) => {
        state.askQuestionStatus = 'loading';
        state.askQuestionError = null;
      })
      .addCase(askNewQuestion.fulfilled, (state, action) => {
        state.askQuestionStatus = 'succeeded';
        // If you want to add the new question to the list immediately without a re-fetch:
        // state.questionsList.unshift(action.payload); // Add to the beginning
        // state.pagination.totalQuestions += 1;
        // Note: This might complicate pagination if not on page 1 or if order is important.
        // Re-fetching or redirecting is often simpler.
      })
      .addCase(askNewQuestion.rejected, (state, action) => {
        state.askQuestionStatus = 'failed';
        state.askQuestionError = action.payload;
      });
  },
});

export const { clearQnAState, clearAskQuestionStatus } = qnaSlice.actions;

// Selectors - These assume 'state.qna' is how this slice is mounted in the root state
export const selectAllQnAQuestions = (state) => state.qna.questionsList;
export const selectQnAStatus = (state) => state.qna.status;
export const selectQnAError = (state) => state.qna.error;
export const selectQnAPagination = (state) => state.qna.pagination;
export const selectAskQuestionStatus = (state) => state.qna.askQuestionStatus;
export const selectAskQuestionError = (state) => state.qna.askQuestionError;

export default qnaSlice.reducer; // This is what you import in your store configuration