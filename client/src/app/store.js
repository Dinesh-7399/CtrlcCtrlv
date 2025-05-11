// client/src/app/store.js
import { configureStore } from '@reduxjs/toolkit';

// Your existing reducers
import usersReducer from '../features/users/UsersSlice';
import coursesReducer from '../features/courses/CoursesSlice';
import articlesReducer from '../features/articles/articlesSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import testimonialsReducer from '../features/testimonials/testimonialsSlice';
import platformReducer from '../features/platform/platformSlice';
import quizReducer from '../features/quiz/quizSlice';
import themeReducer from '../features/theme/themeSlice';
import contactReducer from '../features/contact/contactSlice';

// Admin Reducers
import adminCoursesReducer from '../features/admin/adminCoursesSlice';
import adminArticlesReducer from '../features/admin/adminArticlesSlice';
import adminUsersReducer from '../features/admin/adminUsersSlice';
import adminCategoriesReducer from '../features/admin/adminCategoriesSlice';
import adminAnalyticsReducer from '../features/admin/adminAnalyticsSlice';

// Potentially other admin slices...
// import adminDashboardReducer from '../features/admin/adminDashboardSlice';
// import adminSettingsReducer from '../features/admin/adminSettingsSlice';
// import adminTestimonialsReducer from '../features/admin/adminTestimonialsSlice';

// ** 1. IMPORT YOUR QNA REDUCER **
//    Ensure this path is correct relative to your store.js file
import qnaReducer from '../features/qna/qnaSlice'; // <<<< ADD THIS LINE

export const store = configureStore({
  reducer: {
    // Public/User-facing reducers
    users: usersReducer,
    courses: coursesReducer,
    articles: articlesReducer,
    categories: categoriesReducer,
    testimonials: testimonialsReducer,
    platform: platformReducer,
    quiz: quizReducer,
    theme: themeReducer,
    contact: contactReducer,

    // ** 2. ADD THE QNA REDUCER TO THE STORE WITH THE KEY 'qna' **
    qna: qnaReducer, // <<<< ADD THIS LINE (the key 'qna' is what your selectors expect)

    // Admin-specific reducers
    adminCourses: adminCoursesReducer,
    adminArticles: adminArticlesReducer,
    adminUsers: adminUsersReducer,
    adminCategories: adminCategoriesReducer,
    adminAnalytics: adminAnalyticsReducer,
    // adminDashboard: adminDashboardReducer,
    // adminSettings: adminSettingsReducer,
    // adminTestimonials: adminTestimonialsReducer,
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger), // Optional
  devTools: process.env.NODE_ENV !== 'production', // Enable DevTools in development
});