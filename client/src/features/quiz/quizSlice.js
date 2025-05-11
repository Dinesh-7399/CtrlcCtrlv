// src/features/quiz/quizSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submitQuizAnswersAPI, fetchQuizDetailsAPI } from '../../services/quizService';

// Thunk to submit quiz answers
export const submitQuiz = createAsyncThunk(
  'quiz/submitQuiz',
  async (submissionData, { rejectWithValue }) => {
    // submissionData: { quizId, courseId, lessonId, answers }
    try {
      const apiResponse = await submitQuizAnswersAPI(submissionData);
      if (apiResponse.success) {
        return apiResponse.data; // Expected: { score, totalQuestions, gradedAnswers, attemptId }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Quiz submission failed.');
    } catch (error) {
      return rejectWithValue(error.errors || error.message || 'Error submitting quiz.');
    }
  }
);

// Optional: Thunk to fetch quiz data if not fully available from CoursesSlice
export const fetchQuizData = createAsyncThunk(
  'quiz/fetchData',
  async (quizId, { rejectWithValue }) => {
    try {
      const response = await fetchQuizDetailsAPI(quizId);
      if (response.success) {
        return response.data; // { id, title, questions }
      }
      return rejectWithValue(response.message);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


const initialState = {
  // currentQuizContent: null, // If fetching quiz separately
  // isLoadingQuizContent: false,
  // errorQuizContent: null,

  userAnswers: {}, // Store answers for the current attempt locally in component or here if persisting across mounts
  submissionStatus: 'idle', // 'idle' | 'submitting' | 'succeeded' | 'failed'
  submissionError: null,
  quizResult: null, // Stores { score, totalQuestions, gradedAnswers, attemptId }
};

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    resetQuizState: (state) => {
      state.userAnswers = {};
      state.submissionStatus = 'idle';
      state.submissionError = null;
      state.quizResult = null;
      // state.currentQuizContent = null; // if fetching separately
      // state.isLoadingQuizContent = false;
      // state.errorQuizContent = null;
    },
    // Action to update user's answer for a question, if managing answers in Redux
    // updateUserAnswer: (state, action) => {
    //   const { questionId, answer } = action.payload;
    //   state.userAnswers[questionId] = answer;
    // },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Quiz Data (Optional)
      .addCase(fetchQuizData.pending, (state) => {
        // state.isLoadingQuizContent = true; state.errorQuizContent = null;
      })
      .addCase(fetchQuizData.fulfilled, (state, action) => {
        // state.isLoadingQuizContent = false; state.currentQuizContent = action.payload;
      })
      .addCase(fetchQuizData.rejected, (state, action) => {
        // state.isLoadingQuizContent = false; state.errorQuizContent = action.payload;
      })
      // Submit Quiz
      .addCase(submitQuiz.pending, (state) => {
        state.submissionStatus = 'submitting';
        state.submissionError = null;
        state.quizResult = null;
      })
      .addCase(submitQuiz.fulfilled, (state, action) => {
        state.submissionStatus = 'succeeded';
        state.quizResult = action.payload; // { score, totalQuestions, gradedAnswers, attemptId }
      })
      .addCase(submitQuiz.rejected, (state, action) => {
        state.submissionStatus = 'failed';
        state.submissionError = action.payload;
      });
  },
});

export const { resetQuizState /*, updateUserAnswer*/ } = quizSlice.actions;

// Selectors
// export const selectCurrentQuizData = (state) => state.quiz.currentQuizContent;
// export const selectIsLoadingQuiz = (state) => state.quiz.isLoadingQuizContent;
export const selectQuizSubmissionStatus = (state) => state.quiz.submissionStatus;
export const selectQuizSubmissionError = (state) => state.quiz.submissionError;
export const selectQuizResult = (state) => state.quiz.quizResult;
// export const selectUserQuizAnswers = (state) => state.quiz.userAnswers; // If answers in Redux

export default quizSlice.reducer;