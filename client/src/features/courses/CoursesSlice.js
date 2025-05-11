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
} from '../../services/courseService.js'; // Ensure path is correct

// Helper to extract a usable error message from the structured error object
const getErrorMessage = (error) => {
    // error object here is what handleApiError from service throws
    if (error && Array.isArray(error.errors) && error.errors.length > 0) {
        return error.errors.map(e => typeof e === 'string' ? e : e.msg || e.message || 'Detailed error').join('; ');
    }
    return error?.message || 'An unknown error occurred. Please try again.';
};

// --- Thunks ---
export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchCoursesAPI(params); // Service returns backend's ApiResponse
      if (apiResponse.success && apiResponse.data) {
        // Expecting apiResponse.data to be:
        // { courses: [], currentPage, totalPages, totalCourses, availableCategories }
        return {
          courses: apiResponse.data.courses || [],
          currentPage: apiResponse.data.currentPage || 1,
          totalPages: apiResponse.data.totalPages || 0,
          totalCourses: apiResponse.data.totalCourses || 0,
          availableCategories: apiResponse.data.availableCategories || [], // Ensure backend sends this
        };
      }
      // If backend says success:false or data is missing
      return rejectWithValue(apiResponse.message || 'Failed to fetch courses: Server indicated an issue.');
    } catch (error) { // This 'error' is the structured object from handleApiError
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'courses/fetchCourseDetails',
  async (identifier, { rejectWithValue, getState }) => {
    try {
      const apiResponse = await fetchCourseByIdentifierAPI(identifier);
      if (apiResponse.success && apiResponse.data && apiResponse.data.course) {
        let courseData = apiResponse.data.course;
        // Backend's getCourseBySlugOrId in your courseController already includes isEnrolled if req.user exists.
        // If it might not, or for an extra layer of client-side check:
        const { user } = getState().auth; // Assuming auth slice is 'auth' and has 'user'
        const { enrolledCourses } = getState().courses;

        if (user && !courseData.hasOwnProperty('isEnrolled') && Array.isArray(enrolledCourses)) {
            const idToCompare = courseData.id;
            const isEnrolledCheck = enrolledCourses.some(ec => ec.course?.id === idToCompare || ec.courseId === idToCompare);
            courseData = { ...courseData, isEnrolled: isEnrolledCheck };
        } else if (!user && !courseData.hasOwnProperty('isEnrolled')) {
            courseData = { ...courseData, isEnrolled: false };
        }
        return courseData;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch course details: Server indicated an issue.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
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
      return rejectWithValue(apiResponse.message || 'Failed to fetch lesson content: Server indicated an issue.');
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
        const courseIdentifier = typeof courseId === 'number' ? courseId : getState().courses.currentCourse?.slug || courseId;
        if (courseIdentifier) {
            dispatch(fetchCourseDetails(courseIdentifier)); // Re-fetch to update isEnrolled status
        }
        return apiResponse.data.enrollment;
      }
      return rejectWithValue(apiResponse.message || 'Enrollment failed: Server indicated an issue.');
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
      if (apiResponse.success && apiResponse.data && Array.isArray(apiResponse.data.enrolledCourses)) {
        return apiResponse.data.enrolledCourses;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch enrolled courses: Server indicated an issue.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const submitCourseReview = createAsyncThunk(
  'courses/submitCourseReview',
  async ({ courseId, reviewData }, { rejectWithValue, dispatch }) => {
    try {
      const apiResponse = await submitCourseReviewAPI(courseId, reviewData);
      if (apiResponse.success && apiResponse.data && apiResponse.data.review) {
        dispatch(fetchCourseReviews({ courseId }));
        // Optionally, re-fetch course details if average rating is displayed and updated on backend
        // dispatch(fetchCourseDetails(courseId)); 
        return apiResponse.data.review;
      }
      return rejectWithValue(apiResponse.message || 'Failed to submit review: Server indicated an issue.');
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
        return { courseId, reviewsData: apiResponse.data };
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch reviews: Server indicated an issue.');
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// --- Initial State (from your uploaded file) ---
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
  enrolledCourses: [],
  enrolledStatus: 'idle',
  enrolledError: null,
  currentCourseReviews: {
    reviews: [],
    currentPage: 1,
    totalPages: 0,
    totalReviews: 0,
    status: 'idle',
    error: null,
  },
  submissionStatus: {
    enrollment: 'idle',
    review: 'idle',
  },
  submissionError: {
    enrollment: null,
    review: null,
  },
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: { // Your existing reducers are good
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
      state.detailsStatus = 'idle';
      state.detailsError = null;
      state.currentCourseReviews = { ...initialState.currentCourseReviews };
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
        state.submissionStatus = { ...initialState.submissionStatus };
        state.submissionError = { ...initialState.submissionError };
      }
    },
    // setAvailableCategories can be kept if needed for manual override or specific scenarios
    // but fetchCourses should be the primary source.
  },
  extraReducers: (builder) => {
    builder
      // Fetch Courses (List)
      .addCase(fetchCourses.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.courses = action.payload.courses;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalCourses = action.payload.totalCourses;
        state.availableCategories = (action.payload.availableCategories || []).map(cat => ({
            name: cat.name,
            slug: cat.slug || String(cat.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
            id: cat.id // Ensure backend sends id for categories if used by filters beyond slug
        }));
        state.error = null;
      })
      .addCase(fetchCourses.rejected, (state, action) => { 
        state.status = 'failed'; 
        state.error = action.payload; // String message
        state.courses = []; 
        state.availableCategories = []; // Clear on error
      })

      // Fetch Course Details (Single)
      .addCase(fetchCourseDetails.pending, (state) => { 
        state.detailsStatus = 'loading'; 
        state.detailsError = null; 
        // Clearing currentCourse on pending might cause UI flicker if user navigates quickly
        // state.currentCourse = null; 
        state.currentCourseReviews = initialState.currentCourseReviews;
      })
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.currentCourse = action.payload;
        state.detailsError = null;
      })
      .addCase(fetchCourseDetails.rejected, (state, action) => { 
        state.detailsStatus = 'failed'; 
        state.detailsError = action.payload; 
        state.currentCourse = null; 
      })

      // Fetch Lesson Details
      .addCase(fetchLessonDetails.pending, (state) => { state.lessonStatus = 'loading'; state.lessonError = null; state.currentLesson = null; })
      .addCase(fetchLessonDetails.fulfilled, (state, action) => { state.lessonStatus = 'succeeded'; state.currentLesson = action.payload; state.lessonError = null;})
      .addCase(fetchLessonDetails.rejected, (state, action) => { state.lessonStatus = 'failed'; state.lessonError = action.payload; state.currentLesson = null; })

      // Enroll In Course
      .addCase(enrollInCourse.pending, (state) => { state.submissionStatus.enrollment = 'loading'; state.submissionError.enrollment = null; })
      .addCase(enrollInCourse.fulfilled, (state, action) => { 
        state.submissionStatus.enrollment = 'succeeded'; 
        const courseId = action.meta.arg; // courseId passed to the thunk
        if (state.currentCourse && (state.currentCourse.id === courseId || state.currentCourse.slug === courseId)) {
            state.currentCourse.isEnrolled = true; // Optimistic update
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => { state.submissionStatus.enrollment = 'failed'; state.submissionError.enrollment = action.payload; })

      // Fetch My Enrolled Courses
      .addCase(fetchMyEnrolledCourses.pending, (state) => { state.enrolledStatus = 'loading'; state.enrolledError = null; })
      .addCase(fetchMyEnrolledCourses.fulfilled, (state, action) => { state.enrolledStatus = 'succeeded'; state.enrolledCourses = action.payload || []; state.enrolledError = null;})
      .addCase(fetchMyEnrolledCourses.rejected, (state, action) => { state.enrolledStatus = 'failed'; state.enrolledError = action.payload; state.enrolledCourses = []; })

      // Submit Course Review
      .addCase(submitCourseReview.pending, (state) => { state.submissionStatus.review = 'loading'; state.submissionError.review = null; })
      .addCase(submitCourseReview.fulfilled, (state) => { state.submissionStatus.review = 'succeeded'; })
      .addCase(submitCourseReview.rejected, (state, action) => { state.submissionStatus.review = 'failed'; state.submissionError.review = action.payload; })

      // Fetch Course Reviews
      .addCase(fetchCourseReviews.pending, (state) => { state.currentCourseReviews.status = 'loading'; state.currentCourseReviews.error = null; })
      .addCase(fetchCourseReviews.fulfilled, (state, action) => {
        const courseIdFromAction = typeof action.payload.courseId === 'string' ? parseInt(action.payload.courseId, 10) : action.payload.courseId;
        if (state.currentCourse && state.currentCourse.id === courseIdFromAction) {
          state.currentCourseReviews = {
            ...state.currentCourseReviews,
            status: 'succeeded',
            reviews: action.payload.reviewsData.reviews || [],
            currentPage: action.payload.reviewsData.currentPage || 1,
            totalPages: action.payload.reviewsData.totalPages || 0,
            totalReviews: action.payload.reviewsData.totalReviews || 0,
            error: null,
          };
        }
      })
      .addCase(fetchCourseReviews.rejected, (state, action) => {
        const courseIdFromAction = typeof action.meta.arg.courseId === 'string' ? parseInt(action.meta.arg.courseId, 10) : action.meta.arg.courseId;
         if (state.currentCourse && state.currentCourse.id === courseIdFromAction) {
            state.currentCourseReviews.status = 'failed';
            state.currentCourseReviews.error = action.payload;
        }
      });
  },
});

export const { clearCurrentCourse, clearCurrentLesson, clearSubmissionStatus } = coursesSlice.actions;

// --- Selectors (largely from your file, with minor safety checks) ---
// Ensure state.courses exists before trying to access its properties
const selectCoursesSliceSafe = (state) => state.courses || initialState;

export const selectAllCourses = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.courses);
export const selectCoursesStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.status);
export const selectCoursesError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.error);

export const selectCoursesPagination = createSelector(
  [selectCoursesSliceSafe],
  (coursesState) => ({
    currentPage: coursesState.currentPage,
    totalPages: coursesState.totalPages,
    totalCourses: coursesState.totalCourses,
  })
);

export const selectAvailableCategoriesForFilter = createSelector(
    [selectCoursesSliceSafe],
    (coursesState) => (coursesState.availableCategories || []).map(cat => ({
        name: cat.name,
        slug: cat.slug || String(cat.name).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        id: cat.id
    }))
);

export const selectCurrentCourse = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.currentCourse);
export const selectCourseDetailsStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.detailsStatus);
export const selectCourseDetailsError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.detailsError);

export const selectCourseById = createSelector(
  [selectCurrentCourse, selectAllCourses, (_, identifier) => identifier],
  (currentCourse, allCourses, identifier) => {
    if (identifier == null) return null; // Handles both null and undefined
    const isNumericId = /^\d+$/.test(String(identifier));
    const idToCompare = isNumericId ? parseInt(String(identifier), 10) : null;

    if (currentCourse) {
        if (isNumericId && currentCourse.id === idToCompare) return currentCourse;
        if (!isNumericId && currentCourse.slug === identifier) return currentCourse;
    }
    if (isNumericId) return allCourses.find(course => course.id === idToCompare) || null;
    return allCourses.find(course => course.slug === identifier) || null;
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
            moduleId: moduleItem.id, 
            moduleTitle: moduleItem.title, 
            courseId: course.id 
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
    const numLessonId = typeof lessonId === 'string' ? parseInt(lessonId, 10) : lessonId;
    return lessons.find(lesson => lesson.id === numLessonId) || null;
  }
);

export const selectCurrentLessonContent = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.currentLesson);
export const selectLessonContentStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.lessonStatus);
export const selectLessonContentError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.lessonError);

export const selectUserEnrolledCourses = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.enrolledCourses);
export const selectEnrolledCoursesStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.enrolledStatus);
export const selectEnrolledCoursesError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.enrolledError);

export const selectReviewsForCurrentCourse = createSelector([selectCoursesSliceSafe], 
    (coursesState) => coursesState.currentCourseReviews
);
export const selectReviewSubmissionStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.submissionStatus.review);
export const selectReviewSubmissionError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.submissionError.review);

export const selectEnrollmentStatus = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.submissionStatus.enrollment);
export const selectEnrollmentSubmissionError = createSelector([selectCoursesSliceSafe], (coursesState) => coursesState.submissionError.enrollment);

export const selectIsUserEnrolledInCourse = createSelector(
  [selectUserEnrolledCourses, (_, courseIdentifier) => courseIdentifier],
  (enrolledCourses, courseIdentifier) => {
    if (!courseIdentifier || !Array.isArray(enrolledCourses) || enrolledCourses.length === 0) return false;
    
    const isNumericId = /^\d+$/.test(String(courseIdentifier));
    const idToCompare = isNumericId ? parseInt(String(courseIdentifier), 10) : null;

    return enrolledCourses.some(enrolled => {
        if (!enrolled.course) return false;
        if (isNumericId) return enrolled.course.id === idToCompare;
        return enrolled.course.slug === courseIdentifier;
    });
  }
);

export default coursesSlice.reducer;