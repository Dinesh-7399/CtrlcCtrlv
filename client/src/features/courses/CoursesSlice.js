// client/src/features/courses/CoursesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import {
  fetchCoursesAPI,
  fetchCourseByIdentifierAPI,
  fetchLessonDetailsAPI,
  enrollInCourseAPI,
  fetchMyEnrolledCoursesAPI,
  submitCourseReviewAPI,
  fetchCourseReviewsAPI,
} from '../../services/courseService.js';

// Helper to extract a usable error message from the Error object
const getErrorMessage = (error) => {
  // error is now an Error object with potential custom properties like .errors
  if (error && Array.isArray(error.errors) && error.errors.length > 0) {
    return error.errors.map(e => (typeof e === 'string' ? e : e.msg || e.message || 'Detailed error')).join('; ');
  }
  return error?.message || 'An unknown error occurred. Please try again.';
};

const initialCourseReviewsState = {
    items: [],
    status: 'idle',
    error: null,
    courseId: null,
    pagination: { currentPage: 1, totalPages: 0, totalReviews: 0 },
};

const initialSubmissionStatusState = {
    enrollment: 'idle',
    review: 'idle',
};
const initialSubmissionErrorState = {
    enrollment: null,
    review: null,
};

const initialState = {
  courses: [],
  currentPage: 1,
  totalPages: 0,
  totalCourses: 0,
  availableCategories: [],
  status: 'idle',
  error: null,

  currentCourse: null,
  detailsStatus: 'idle',
  detailsError: null,

  currentLesson: null,
  lessonStatus: 'idle',
  lessonError: null,

  userEnrollments: [],
  enrolledStatus: 'idle',
  enrolledError: null,

  currentCourseReviews: { ...initialCourseReviewsState },
  submissionStatus: { ...initialSubmissionStatusState },
  submissionError: { ...initialSubmissionErrorState },
};

// --- Thunks ---
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    console.log('[CoursesSlice] fetchCourses thunk started with params:', params);
    try {
      const apiResponse = await fetchCoursesAPI(params);
      if (apiResponse.success && apiResponse.data) {
        return {
          courses: apiResponse.data.courses || [],
          currentPage: apiResponse.data.currentPage || 1,
          totalPages: apiResponse.data.totalPages || 0,
          totalCourses: apiResponse.data.totalCourses || 0,
          availableCategories: apiResponse.data.availableCategories || [],
        };
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch courses: Server response indicates failure.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'courses/fetchCourseDetails',
  async (identifier, { rejectWithValue, getState }) => {
    console.log('[CoursesSlice] fetchCourseDetails thunk started for identifier:', identifier);
    if (!identifier) {
      return rejectWithValue('Course identifier is required to fetch details.');
    }
    try {
      const apiResponse = await fetchCourseByIdentifierAPI(identifier);
      console.log('[CoursesSlice] fetchCourseDetails received API response:', apiResponse);

      if (apiResponse && apiResponse.success && apiResponse.data && apiResponse.data.course) {
        let courseData = apiResponse.data.course;
        if (!courseData.hasOwnProperty('isEnrolled')) {
            const { user } = getState().auth || {}; // Ensure auth state exists
            const { userEnrollments } = getState().courses;
            if (user && Array.isArray(userEnrollments)) {
                const isEnrolledCheck = userEnrollments.some(
                    ec => ec.course && String(ec.course.id) === String(courseData.id)
                );
                courseData.isEnrolled = isEnrolledCheck;
            } else {
                courseData.isEnrolled = false;
            }
        }
        console.log('[CoursesSlice] fetchCourseDetails success, returning courseData:', courseData);
        return courseData;
      } else {
        const errorMessage = apiResponse?.message || 'Course data not found or invalid response from server.';
        return rejectWithValue(errorMessage);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('[CoursesSlice] fetchCourseDetails thunk caught CATCH block error:', error, 'Processed:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchLessonDetails = createAsyncThunk(
  'courses/fetchLessonDetails',
  async ({ courseId, lessonId }, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchLessonDetailsAPI(courseId, lessonId);
      if (apiResponse.success && apiResponse.data && apiResponse.data.lesson) {
        return apiResponse.data.lesson;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch lesson content.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const enrollInCourse = createAsyncThunk(
  'courses/enrollInCourse',
  async (courseId, { rejectWithValue, dispatch, getState }) => {
    try {
      const apiResponse = await enrollInCourseAPI(courseId);
      if (apiResponse.success && apiResponse.data && apiResponse.data.enrollment) {
        dispatch(fetchMyEnrolledCourses()); 
        const currentCourseInState = getState().courses.currentCourse;
        if (currentCourseInState && (String(currentCourseInState.id) === String(courseId))) {
             const identifierToRefetch = currentCourseInState.slug || currentCourseInState.id;
             dispatch(fetchCourseDetails(identifierToRefetch));
        }
        return apiResponse.data.enrollment;
      }
      return rejectWithValue(apiResponse.message || 'Enrollment failed.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMyEnrolledCourses = createAsyncThunk(
  'courses/fetchMyEnrolledCourses',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchMyEnrolledCoursesAPI();
      if (apiResponse.success && Array.isArray(apiResponse.data?.enrolledCourses)) {
        return apiResponse.data.enrolledCourses;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch enrolled courses structure.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitCourseReview = createAsyncThunk(
  'courses/submitCourseReview',
  async ({ courseId, rating, comment }, { rejectWithValue, dispatch }) => {
    try {
      const reviewData = { rating, comment };
      const apiResponse = await submitCourseReviewAPI(courseId, reviewData);
      if (apiResponse.success && apiResponse.data && apiResponse.data.review) {
        dispatch(fetchCourseReviews({ courseId, params: { page: 1, limit: 5 } }));
        dispatch(fetchCourseDetails(courseId)); 
        return apiResponse.data.review;
      }
      return rejectWithValue(apiResponse.message || 'Failed to submit review.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCourseReviews = createAsyncThunk(
  'courses/fetchCourseReviews',
  async ({ courseId, params = {} }, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchCourseReviewsAPI(courseId, params);
      if (apiResponse.success && apiResponse.data) {
        return { 
            courseId, 
            reviews: apiResponse.data.reviews || [],
            pagination: apiResponse.data.pagination || { currentPage: 1, totalPages: 0, totalReviews: 0 }
        };
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch reviews.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// --- Slice Definition ---
const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.detailsStatus = 'idle';
      state.detailsError = null;
      state.currentCourseReviews = { ...initialCourseReviewsState, courseId: null, items: [], status: 'idle' };
    },
    clearCurrentLesson: (state) => {
      state.currentLesson = null;
      state.lessonStatus = 'idle';
      state.lessonError = null;
    },
    clearSubmissionStatus: (state, action) => {
      const { type } = action.payload || {};
      if (type && state.submissionStatus[type]) {
        state.submissionStatus[type] = 'idle';
        if(state.submissionError && state.submissionError[type]) state.submissionError[type] = null;
      } else if (!type) {
        state.submissionStatus = { ...initialSubmissionStatusState };
        state.submissionError = { ...initialSubmissionErrorState };
      }
    },
  },
  extraReducers: (builder) => {
    // Cases for fetchCourses
    builder.addCase(fetchCourses.pending, (state) => { state.status = 'loading'; state.error = null; });
    builder.addCase(fetchCourses.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.courses = action.payload.courses;
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
      state.totalCourses = action.payload.totalCourses;
      state.availableCategories = (action.payload.availableCategories || []).map(cat => ({
          name: cat.name,
          slug: cat.slug || String(cat.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
          id: cat.id
      }));
      state.error = null;
    });
    builder.addCase(fetchCourses.rejected, (state, action) => { 
      state.status = 'failed'; state.error = action.payload; state.courses = []; state.availableCategories = [];
    });

    // Cases for fetchCourseDetails
    builder.addCase(fetchCourseDetails.pending, (state) => { state.detailsStatus = 'loading'; state.detailsError = null; });
    builder.addCase(fetchCourseDetails.fulfilled, (state, action) => {
      state.detailsStatus = 'succeeded'; state.currentCourse = action.payload; state.detailsError = null;
    });
    builder.addCase(fetchCourseDetails.rejected, (state, action) => { 
      state.detailsStatus = 'failed'; state.detailsError = action.payload; state.currentCourse = null; 
    });

    // Cases for fetchLessonDetails
    builder.addCase(fetchLessonDetails.pending, (state) => { state.lessonStatus = 'loading'; state.lessonError = null; state.currentLesson = null; });
    builder.addCase(fetchLessonDetails.fulfilled, (state, action) => { state.lessonStatus = 'succeeded'; state.currentLesson = action.payload; state.lessonError = null;});
    builder.addCase(fetchLessonDetails.rejected, (state, action) => { state.lessonStatus = 'failed'; state.lessonError = action.payload; state.currentLesson = null; });

    // Cases for enrollInCourse
    builder.addCase(enrollInCourse.pending, (state) => { state.submissionStatus.enrollment = 'loading'; state.submissionError.enrollment = null; });
    builder.addCase(enrollInCourse.fulfilled, (state) => { state.submissionStatus.enrollment = 'succeeded'; });
    builder.addCase(enrollInCourse.rejected, (state, action) => { state.submissionStatus.enrollment = 'failed'; state.submissionError.enrollment = action.payload; });

    // Cases for fetchMyEnrolledCourses
    builder.addCase(fetchMyEnrolledCourses.pending, (state) => { state.enrolledStatus = 'loading'; state.enrolledError = null; });
    builder.addCase(fetchMyEnrolledCourses.fulfilled, (state, action) => { state.enrolledStatus = 'succeeded'; state.userEnrollments = action.payload || []; state.enrolledError = null;});
    builder.addCase(fetchMyEnrolledCourses.rejected, (state, action) => { state.enrolledStatus = 'failed'; state.enrolledError = action.payload; state.userEnrollments = []; });

    // Cases for submitCourseReview
    builder.addCase(submitCourseReview.pending, (state) => { state.reviewSubmission.status = 'loading'; state.reviewSubmission.error = null; });
    builder.addCase(submitCourseReview.fulfilled, (state) => { state.reviewSubmission.status = 'succeeded'; });
    builder.addCase(submitCourseReview.rejected, (state, action) => { state.reviewSubmission.status = 'failed'; state.reviewSubmission.error = action.payload; });

    // Cases for fetchCourseReviews
    builder.addCase(fetchCourseReviews.pending, (state) => { state.currentCourseReviews.status = 'loading'; state.currentCourseReviews.error = null; });
    builder.addCase(fetchCourseReviews.fulfilled, (state, action) => {
      state.currentCourseReviews.status = 'succeeded';
      state.currentCourseReviews.items = action.payload.reviews;
      state.currentCourseReviews.pagination = action.payload.pagination;
      state.currentCourseReviews.courseId = String(action.payload.courseId);
      state.currentCourseReviews.error = null;
    });
    builder.addCase(fetchCourseReviews.rejected, (state, action) => {
      state.currentCourseReviews.status = 'failed';
      state.currentCourseReviews.error = action.payload;
    });
  },
});

export const { clearCurrentCourse, clearCurrentLesson, clearSubmissionStatus } = coursesSlice.actions;

// --- Selectors ---
// Base selector with a default to prevent errors if state.courses is momentarily undefined
const selectCoursesState = (state) => state.courses || initialState;

export const selectAllCourses = createSelector([selectCoursesState], (coursesState) => coursesState.courses);
export const selectCoursesStatus = createSelector([selectCoursesState], (coursesState) => coursesState.status);
export const selectCoursesError = createSelector([selectCoursesState], (coursesState) => coursesState.error);
export const selectCoursesPagination = createSelector(
  [selectCoursesState],
  (coursesState) => ({
    currentPage: coursesState.currentPage,
    totalPages: coursesState.totalPages,
    totalCourses: coursesState.totalCourses,
  })
);
export const selectAvailableCategoriesForFilter = createSelector(
    [selectCoursesState], (coursesState) => coursesState.availableCategories || []
);

export const selectCurrentCourse = createSelector([selectCoursesState], (coursesState) => coursesState.currentCourse);
export const selectCourseDetailsStatus = createSelector([selectCoursesState], (coursesState) => coursesState.detailsStatus);
export const selectCourseDetailsError = createSelector([selectCoursesState], (coursesState) => coursesState.detailsError);

export const selectCourseById = createSelector(
  [selectCurrentCourse, selectAllCourses, (_, identifier) => identifier],
  (currentCourse, allCoursesFromList, identifier) => {
    if (identifier == null) return null;
    const isNumericId = /^\d+$/.test(String(identifier));
    const idToCompare = isNumericId ? parseInt(String(identifier), 10) : String(identifier).toLowerCase();

    if (currentCourse) {
      const currentIdMatches = isNumericId && String(currentCourse.id) === String(idToCompare);
      const currentSlugMatches = !isNumericId && currentCourse.slug && currentCourse.slug.toLowerCase() === idToCompare;
      if (currentIdMatches || currentSlugMatches) return currentCourse;
    }
    return (allCoursesFromList || []).find(course => 
        (isNumericId && String(course.id) === String(idToCompare)) || 
        (!isNumericId && course.slug && course.slug.toLowerCase() === idToCompare)
    ) || null;
  }
);

export const selectAllLessonsFlat = createSelector(
  [selectCurrentCourse],
  (course) => {
    if (!course || !Array.isArray(course.modules)) return [];
    return course.modules.reduce((acc, moduleItem) => {
      if (moduleItem && Array.isArray(moduleItem.lessons)) {
        const lessonsWithContext = moduleItem.lessons.map(lesson => ({ 
            ...lesson, 
            moduleId: moduleItem.id, moduleTitle: moduleItem.title, courseId: course.id 
        }));
        acc.push(...lessonsWithContext);
      }
      return acc;
    }, []);
  }
);

export const selectLessonById = createSelector(
  [selectAllLessonsFlat, (_, lessonId) => lessonId],
  (lessons, lessonId) => {
    if (lessonId == null) return null;
    const idToCompare = String(lessonId); // Compare as string for consistency
    return (lessons || []).find(lesson => String(lesson.id) === idToCompare) || null;
  }
);

export const selectCurrentLessonContent = createSelector([selectCoursesState], (coursesState) => coursesState.currentLesson);
export const selectLessonContentStatus = createSelector([selectCoursesState], (coursesState) => coursesState.lessonStatus);
export const selectLessonContentError = createSelector([selectCoursesState], (coursesState) => coursesState.lessonError);

export const selectUserEnrollments = createSelector([selectCoursesState], (coursesState) => coursesState.userEnrollments);
export const selectEnrolledCoursesStatus = createSelector([selectCoursesState], (coursesState) => coursesState.enrolledStatus);
// Line 417 from your error message could be here if `coursesState.enrolledError` is attempted on undefined `coursesState`
export const selectEnrolledCoursesError = createSelector([selectCoursesState], (coursesState) => coursesState.enrolledError);

export const selectReviewsForCurrentCourse = createSelector([selectCoursesState], 
    (coursesState) => coursesState.currentCourseReviews || initialCourseReviewsState
);
export const selectReviewSubmissionStatus = createSelector([selectCoursesState], 
    (coursesState) => (coursesState.submissionStatus || initialSubmissionStatusState).review
);
export const selectReviewSubmissionError = createSelector([selectCoursesState], 
    (coursesState) => (coursesState.submissionError || initialSubmissionErrorState).review
);

export const selectEnrollmentStatus = createSelector([selectCoursesState], 
    (coursesState) => (coursesState.submissionStatus || initialSubmissionStatusState).enrollment
);
export const selectEnrollmentSubmissionError = createSelector([selectCoursesState], 
    (coursesState) => (coursesState.submissionError || initialSubmissionErrorState).enrollment
);

export const selectIsUserEnrolledInCourse = createSelector(
  [selectUserEnrollments, (_, courseId) => courseId],
  (userEnrollments, targetCourseId) => {
    if (!targetCourseId || !Array.isArray(userEnrollments) || userEnrollments.length === 0) {
      return false;
    }
    return userEnrollments.some(enrollment => 
      enrollment && enrollment.course && String(enrollment.course.id) === String(targetCourseId)
    );
  }
);

// Assuming this is for a different slice, or needs to be defined more specifically
// export const selectQuizSuccessMessage = (state) => state.quiz?.quizResult?.message; 

export default coursesSlice.reducer;