// src/features/theme/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentTheme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.currentTheme = action.payload;
    },
    toggleTheme: (state) => {
      state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer; // Correct default export
export const selectCurrentTheme = (state) => state.theme.currentTheme; // Correct selector