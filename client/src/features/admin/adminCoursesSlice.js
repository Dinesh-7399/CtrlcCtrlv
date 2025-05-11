// client/src/features/admin/adminCoursesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

// Service Imports - Verify these paths and that the service files exist and export the named functions.
import {
  createAdminCourseAPI,
  fetchAdminCourseByIdAPI,
  updateAdminCourseAPI,
  deleteAdminCourseAPI,
  fetchAdminCoursesListAPI, // Assuming this will be implemented in adminCourseService.js
} from '../../services/adminCourseService.js';

import { fetchAdminCategoriesAPI } from '../../services/adminCategoryService.js'; // CRUCIAL: This file must exist and export this function

import { fetchAdminUsersListAPI } from '../../services/adminUserService.js'; // For fetching instructors

// --- Thunks ---

// Fetch list of all courses for the admin panel
export const fetchAdminCoursesList = createAsyncThunk(
  'adminCourses/fetchAdminCoursesList',
  async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
    try {
      // Replace with actual API call. Ensure fetchAdminCoursesListAPI is implemented in adminCourseService.js
      const apiResponse = await fetchAdminCoursesListAPI(params);
      if (apiResponse.success) {
        return apiResponse.data; // Expected: { courses, currentPage, totalPages, totalCourses }
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch admin courses list.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error fetching admin courses list.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Create a new course
export const createAdminCourse = createAsyncThunk(
  'adminCourses/createAdminCourse',
  async (courseData, { rejectWithValue }) => {
    try {
      const apiResponse = await createAdminCourseAPI(courseData);
      if (apiResponse.success) {
        return apiResponse.data.course;
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to create course.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error creating course.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Fetch a single course by ID for editing
export const fetchAdminCourseForEdit = createAsyncThunk(
  'adminCourses/fetchAdminCourseForEdit',
  async (courseId, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminCourseByIdAPI(courseId);
      if (apiResponse.success) {
        return apiResponse.data.course;
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to fetch course for editing.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error fetching course for editing.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Update an existing course
export const updateAdminCourse = createAsyncThunk(
  'adminCourses/updateAdminCourse',
  async ({ courseId, courseData }, { rejectWithValue }) => {
    try {
      const apiResponse = await updateAdminCourseAPI(courseId, courseData);
      if (apiResponse.success) {
        return apiResponse.data.course;
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to update course.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error updating course.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Delete a course
export const deleteAdminCourse = createAsyncThunk(
  'adminCourses/deleteAdminCourse',
  async (courseId, { rejectWithValue }) => {
    try {
      const apiResponse = await deleteAdminCourseAPI(courseId);
      if (apiResponse.success) {
        return courseId; // Return the ID for removal from state
      }
      return rejectWithValue(apiResponse.errors || apiResponse.message || 'Failed to delete course.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error deleting course.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Fetch categories for form dropdowns
export const fetchCategoriesForForm = createAsyncThunk(
  'adminCourses/fetchCategoriesForForm',
  async (_, { rejectWithValue }) => {
    try {
      const apiResponse = await fetchAdminCategoriesAPI(); // From adminCategoryService.js
      if (apiResponse.success) {
        return apiResponse.data.categories;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch categories for form.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error fetching categories for form.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

// Fetch instructors (users with 'INSTRUCTOR' role) for form dropdowns
export const fetchInstructorsForForm = createAsyncThunk(
  'adminCourses/fetchInstructorsForForm',
  async (_, { rejectWithValue }) => {
    try {
      // Assuming fetchAdminUsersListAPI can filter by role
      const apiResponse = await fetchAdminUsersListAPI({ role: 'INSTRUCTOR', limit: 1000 }); // Ensure role matches backend
      if (apiResponse.success) {
        return apiResponse.data.users;
      }
      return rejectWithValue(apiResponse.message || 'Failed to fetch instructors for form.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Error fetching instructors for form.';
      return rejectWithValue(error.response?.data?.errors || message);
    }
  }
);

const initialState = {
  // For AdminCourseList page
  coursesList: [],
  listPagination: {
    currentPage: 1,
    totalPages: 0,
    totalCourses: 0,
  },
  listStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  listError: null,

  // For AdminCourseEdit/Create pages
  currentEditingCourse: null,
  formDropdowns: {
    categories: [],
    instructors: [],
    isLoadingCategories: false,
    isLoadingInstructors: false,
    errorCategories: null,
    errorInstructors: null,
  },
  editPageStatus: 'idle', // For fetching/saving a single course being edited
  editPageError: null,
  editPageSuccessMessage: '',

  createStatus: 'idle', // For creating a new course
  createError: null,
  createSuccessMessage: '',

  // General operation status for actions like delete that might affect the list
  operationStatus: 'idle',
  operationError: null,
};

const adminCoursesSlice = createSlice({
  name: 'adminCourses',
  initialState,
  reducers: {
    clearCreateCourseStatus: (state) => {
        state.createStatus = 'idle';
        state.createError = null;
        state.createSuccessMessage = '';
     },
    clearEditCourseStatus: (state) => {
      state.currentEditingCourse = null;
      state.editPageStatus = 'idle';
      state.editPageError = null;
      state.editPageSuccessMessage = '';
    },
    setEditPageSuccessMessage: (state, action) => {
        state.editPageSuccessMessage = action.payload;
    },
    clearEditPageSuccessMessage: (state) => {
        state.editPageSuccessMessage = '';
    },
    clearAdminCoursesListError: (state) => {
        state.listError = null;
    },
    clearAdminCourseOperationStatus: (state) => {
        state.operationStatus = 'idle';
        state.operationError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Admin Courses List
      .addCase(fetchAdminCoursesList.pending, (state) => {
        state.listStatus = 'loading';
        state.listError = null;
      })
      .addCase(fetchAdminCoursesList.fulfilled, (state, action) => {
        state.listStatus = 'succeeded';
        state.coursesList = action.payload.courses || [];
        state.listPagination = {
          currentPage: action.payload.currentPage || 1,
          totalPages: action.payload.totalPages || 0,
          totalCourses: action.payload.totalCourses || 0,
        };
      })
      .addCase(fetchAdminCoursesList.rejected, (state, action) => {
        state.listStatus = 'failed';
        state.listError = action.payload;
        state.coursesList = [];
      })

      // Create Admin Course
      .addCase(createAdminCourse.pending, (state) => {
          state.createStatus = 'loading';
          state.createError = null;
          state.createSuccessMessage = '';
      })
      .addCase(createAdminCourse.fulfilled, (state, action) => {
          state.createStatus = 'succeeded';
          state.createSuccessMessage = `Course "${action.payload.title}" created successfully!`;
          // Optionally, refetch the list or add to it for immediate UI update
          // state.listStatus = 'idle'; // To trigger refetch if component depends on it
      })
      .addCase(createAdminCourse.rejected, (state, action) => {
          state.createStatus = 'failed';
          state.createError = action.payload;
      })

      // Fetch Categories for Form
      .addCase(fetchCategoriesForForm.pending, (state) => {
          state.formDropdowns.isLoadingCategories = true;
          state.formDropdowns.errorCategories = null;
      })
      .addCase(fetchCategoriesForForm.fulfilled, (state, action) => {
          state.formDropdowns.isLoadingCategories = false;
          state.formDropdowns.categories = action.payload || [];
      })
      .addCase(fetchCategoriesForForm.rejected, (state, action) => {
          state.formDropdowns.isLoadingCategories = false;
          state.formDropdowns.errorCategories = action.payload;
      })

      // Fetch Instructors for Form
      .addCase(fetchInstructorsForForm.pending, (state) => {
          state.formDropdowns.isLoadingInstructors = true;
          state.formDropdowns.errorInstructors = null;
      })
      .addCase(fetchInstructorsForForm.fulfilled, (state, action) => {
          state.formDropdowns.isLoadingInstructors = false;
          state.formDropdowns.instructors = action.payload || [];
      })
      .addCase(fetchInstructorsForForm.rejected, (state, action) => {
          state.formDropdowns.isLoadingInstructors = false;
          state.formDropdowns.errorInstructors = action.payload;
      })

      // Fetch Admin Course for Edit
      .addCase(fetchAdminCourseForEdit.pending, (state) => {
        state.editPageStatus = 'loading'; // Changed from 'loadingInitial' for clarity
        state.currentEditingCourse = null;
        state.editPageError = null;
      })
      .addCase(fetchAdminCourseForEdit.fulfilled, (state, action) => {
        state.editPageStatus = 'succeeded';
        state.currentEditingCourse = action.payload;
      })
      .addCase(fetchAdminCourseForEdit.rejected, (state, action) => {
        state.editPageStatus = 'failed';
        state.editPageError = action.payload;
      })

      // Update Admin Course
      .addCase(updateAdminCourse.pending, (state) => {
        state.editPageStatus = 'saving';
        state.editPageError = null;
        state.editPageSuccessMessage = '';
      })
      .addCase(updateAdminCourse.fulfilled, (state, action) => {
        state.editPageStatus = 'succeeded';
        state.currentEditingCourse = action.payload; // Update the course being edited
        state.editPageSuccessMessage = `Course "${action.payload.title}" updated successfully!`;
        // Also update the course in the main list if it's present
        const index = state.coursesList.findIndex(course => course.id === action.payload.id);
        if (index !== -1) {
          state.coursesList[index] = action.payload;
        }
      })
      .addCase(updateAdminCourse.rejected, (state, action) => {
        state.editPageStatus = 'failed';
        state.editPageError = action.payload;
      })

      // Delete Admin Course
      .addCase(deleteAdminCourse.pending, (state) => {
        state.operationStatus = 'loading'; // Use general operation status
        state.operationError = null;
      })
      .addCase(deleteAdminCourse.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        state.coursesList = state.coursesList.filter(course => course.id !== action.payload);
        state.listPagination.totalCourses = Math.max(0, state.listPagination.totalCourses - 1);
        // Consider if totalPages needs recalculation or if a list refetch is preferred
      })
      .addCase(deleteAdminCourse.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.operationError = action.payload;
      });
  },
});

export const {
    clearCreateCourseStatus,
    clearEditCourseStatus,
    setEditPageSuccessMessage,
    clearEditPageSuccessMessage,
    clearAdminCoursesListError,
    clearAdminCourseOperationStatus
} = adminCoursesSlice.actions;

// --- Selectors ---
const selectAdminCoursesState = (state) => state.adminCourses;

export const selectAdminCoursesList = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.coursesList || []
);
export const selectAdminCoursesPagination = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.listPagination || { currentPage: 1, totalPages: 0, totalCourses: 0 }
);
export const selectAdminCoursesListStatus = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.listStatus || 'idle'
);
export const selectAdminCoursesListError = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.listError || null
);

export const selectAdminCourseOperationStatus = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.operationStatus || 'idle'
);
export const selectAdminCourseOperationError = createSelector( // Added for delete error
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.operationError || null
);


export const selectAdminCourseCreateStatus = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.createStatus || 'idle'
);
export const selectAdminCourseCreateError = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.createError || null
);
export const selectAdminCourseCreateSuccessMessage = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.createSuccessMessage || ''
);

export const selectCategoriesForForm = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.categories || []
);
export const selectInstructorsForForm = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.instructors || []
);
export const selectIsLoadingCategoriesForForm = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.isLoadingCategories || false
);
export const selectIsLoadingInstructorsForForm = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.isLoadingInstructors || false
);
export const selectFormDropdownErrorCategories = createSelector( // Added selector for category fetch error
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.errorCategories || null
);
export const selectFormDropdownErrorInstructors = createSelector( // Added selector for instructor fetch error
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.formDropdowns?.errorInstructors || null
);


export const selectCurrentEditingCourseData = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.currentEditingCourse || null
);
export const selectAdminCourseEditPageStatus = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.editPageStatus || 'idle'
);
export const selectAdminCourseEditPageError = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.editPageError || null
);
export const selectAdminCourseEditPageSuccessMessage = createSelector(
    [selectAdminCoursesState],
    (adminCourses) => adminCourses?.editPageSuccessMessage || ''
);

export default adminCoursesSlice.reducer;
