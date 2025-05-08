// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
// Correct import assuming filename is 'themeSlice.js'
import themeReducer from '../features/theme/themeSlice.js';
// In store.js
// --- Imports for Courses and Users ---
// *** LIKELY ERROR: Filename Casing ***
// These imports likely need lowercase filenames to match your actual files.
// Also ensure these slices use 'export default'.
import coursesReducer from '../features/courses/CoursesSlice.js'; // Should probably be coursesSlice.js
import usersReducer from '../features/users/UsersSlice.js';   // Should probably be usersSlice.js
import articlesReducer from '../features/articles/articlesSlice';
import testimonialsReducer from '../features/testimonials/testimonialsSlice';
import categoriesReducer from '../features/categories/categoriesSlice';

// Correct export using 'export const'
export const store = configureStore({
  reducer: {
    theme: themeReducer,
    courses: coursesReducer, // Will fail if import above failed
    users: usersReducer,   // Will fail if import above failed
    articles : articlesReducer,
    testimonials : testimonialsReducer,
    categories : categoriesReducer
  },
});