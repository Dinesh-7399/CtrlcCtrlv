// client/src/features/theme/themeSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';

// Function to get the initial theme from localStorage or default to 'light'
const getInitialTheme = () => {
  try {
    const persistedTheme = localStorage.getItem('lmsTheme');
    if (persistedTheme) {
      return persistedTheme;
    }
  } catch (e) {
    console.warn('Could not read theme from localStorage:', e);
  }
  return 'light'; // Default theme
};

const initialState = {
  currentTheme: getInitialTheme(), // e.g., 'light', 'dark'
  // You could add other theme-related settings here if needed
};

const themeSlice = createSlice({
  name: 'theme', // This name will be the key in your Redux store state (e.g., state.theme)
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.currentTheme = action.payload;
      try {
        localStorage.setItem('lmsTheme', action.payload);
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
      }
    },
    toggleTheme: (state) => {
      const newTheme = state.currentTheme === 'light' ? 'dark' : 'light';
      state.currentTheme = newTheme;
      try {
        localStorage.setItem('lmsTheme', newTheme);
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

// --- Selectors ---
// Base selector for the theme state slice
const selectThemeState = (state) => state.theme;

// Memoized and robust selector for the current theme
export const selectCurrentTheme = createSelector(
  [selectThemeState],
  (themeState) => themeState?.currentTheme || 'light' // Provide a default if themeState or currentTheme is undefined
);

export default themeSlice.reducer;
