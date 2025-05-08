// src/features/courses/coursesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'; // Added createSelector

// *** Ensure this path is correct relative to coursesSlice.js ***
import initialData from '../../assets/dummyData.json';

// --- Simulate API Call Delay ---
const ARTIFICIAL_DELAY_MS = 1200; // Different delay

// --- Define Initial State ---
// Start empty, fetch async
const initialState = {
    items: [],         // Will be populated by thunk
    status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- Create Async Thunk to Fetch Courses ---
export const fetchCourses = createAsyncThunk(
    'courses/fetchCourses',
    async (_, { rejectWithValue }) => {
        console.log("Redux Thunk: Simulating course fetch...");
        await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_DELAY_MS));

        try {
            // Simulate potential error (uncomment to test)
            // if (Math.random() > 0.9) { throw new Error('Simulated course fetch error'); }

            // In a real app: const response = await axios.get('/api/courses'); return response.data;
            const courses = initialData?.courses || [];
            console.log("Redux Thunk: Simulated course fetch SUCCEEDED.");
            return courses; // Return the courses array
        } catch (error) {
             console.error("Redux Thunk: Error during simulated course fetch:", error);
            return rejectWithValue(error.message || 'Failed to fetch courses');
        }
    }
);

// --- Create the Slice ---
const coursesSlice = createSlice({
    name: 'courses',
    initialState,
    // Keep existing synchronous reducers
    reducers: {
        updateCourse(state, action) {
            const { id, changes } = action.payload;
            const existingCourseIndex = state.items.findIndex(course => course.id === id);
            if (existingCourseIndex !== -1) {
                state.items[existingCourseIndex] = { ...state.items[existingCourseIndex], ...changes };
            }
        },
        deleteCourse(state, action) {
            const courseIdToDelete = action.payload;
            state.items = state.items.filter(course => course.id !== courseIdToDelete);
        },
        addCourse(state, action) {
            const newCourse = action.payload;
            if (!state.items.find(course => course.id === newCourse.id)) {
                 state.items.push(newCourse);
            }
        }
    },
    // --- Handle Async Thunk Lifecycle Actions ---
    extraReducers: (builder) => {
        builder
            .addCase(fetchCourses.pending, (state) => {
                console.log("Redux extraReducer: fetchCourses.pending");
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                console.log("Redux extraReducer: fetchCourses.fulfilled");
                state.status = 'succeeded';
                state.items = action.payload; // Set items to the fetched array
                state.error = null;
            })
            .addCase(fetchCourses.rejected, (state, action) => {
                console.log("Redux extraReducer: fetchCourses.rejected");
                state.status = 'failed';
                state.error = action.payload || action.error.message || 'Unknown error fetching courses';
                state.items = []; // Clear items on failure
            });
        // Add cases for async add, update, delete actions here later if needed
    }
});

// --- Exports ---

// Export synchronous action creators
export const { updateCourse, deleteCourse, addCourse } = coursesSlice.actions;

// Export the reducer function itself
export default coursesSlice.reducer;

// Export the async thunk
// export { fetchCourses }; // Already exported above

// --- Selectors ---

// Select all courses
export const selectAllCourses = state => state.courses?.items || [];

// Select course by ID (using createSelector for potential memoization)
export const selectCourseById = createSelector(
    // Input selectors: state.courses.items and the courseId argument
    [selectAllCourses, (state, courseId) => courseId],
    // Output function: find the course
    (courses, courseId) => courses.find(course => course.id === courseId) || null // Return null if not found
);

// Select all lessons for a specific course, flattened (memoized)
export const selectAllLessonsFlat = createSelector(
    [selectCourseById], // Depends on the single course selector
    (course) => {
        if (!course || !course.modules) {
            return [];
        }
        return course.modules.flatMap(module =>
            module.lessons?.map(lesson => ({ ...lesson, moduleId: module.id })) || []
        );
    }
);

// Select a specific lesson by course ID and lesson ID (memoized)
export const selectLessonById = createSelector(
    [selectCourseById, (state, courseId, lessonId) => lessonId], // Depends on course and lessonId arg
    (course, lessonId) => {
        if (!course || !course.modules || !lessonId) {
            return undefined;
        }
        for (const module of course.modules) {
            const lesson = module.lessons?.find(l => l.id === lessonId);
            if (lesson) {
                return { ...lesson, moduleId: module.id };
            }
        }
        return undefined;
    }
);

// Select just the modules for a course (memoized)
export const selectCourseModules = createSelector(
    [selectCourseById],
    (course) => course?.modules || []
);

// Select quiz for lesson (memoized)
export const selectQuizForLesson = createSelector(
    [selectCourseById, (state, courseId, lessonId) => lessonId],
    (course, lessonId) => {
         if (!course || !course.quizzes || !lessonId) return undefined;
         // Using your existing fragile assumption logic
         const expectedQuizId = lessonId.replace(/^lesson(-[0-9]+)-([0-9]+)$/, 'quiz$1-$2');
         const quiz = course.quizzes.find(q => q.id === expectedQuizId);
         return (quiz && quiz.questions) ? quiz : undefined;
    }
);

// Select DPP for lesson (memoized)
export const selectDppForLesson = createSelector(
    [selectCourseById, (state, courseId, lessonId) => lessonId],
    (course, lessonId) => {
        if (!course || !course.dpps || !lessonId) return undefined;
        // Using your existing fragile assumption logic
        const expectedDppId = lessonId.replace(/^lesson(-[0-9]+)-([0-9]+)$/, 'dpp$1-$2');
        return course.dpps.find(d => d.id === expectedDppId) || undefined;
    }
);

// Selector for overall status
export const selectCoursesStatus = state => state.courses?.status;

// Selector for error message
export const selectCoursesError = state => state.courses?.error;