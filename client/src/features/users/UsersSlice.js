import { createSlice, createSelector } from '@reduxjs/toolkit';

// --- Step 1: Import your dummy user data ---
// !! IMPORTANT: Adjust this path to where your dummy user file is located !!
import usersData from '../../assets/dummyUser.json';

// --- Step 2: Define the Initial State ---
// Load users into an 'entities' object map where the key is the user ID
// This makes selecting by ID efficient (state.users.entities['user-123'])
const initialState = {
    entities: usersData.reduce((acc, user) => {
        // Ensure user has an ID before adding
        if (user && user.id) {
             acc[user.id] = user;
        } else {
            console.warn("Skipping user data due to missing ID:", user);
        }
        return acc;
    }, {}),
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// --- Step 3: Create the Slice ---
const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        // Define reducers later if you need to modify user data
        // Example:
        // userUpdated(state, action) {
        //   const { id, ...changes } = action.payload;
        //   if (state.entities[id]) {
        //     Object.assign(state.entities[id], changes);
        //   }
        // },
    },
    // Add extraReducers later if you fetch user data asynchronously
});

// --- Step 4: Define Selectors ---

// Base selector to get the user entities object map
const selectUserEntities = (state) => state.users.entities;

// Selector to get all users as an array
export const selectAllUsers = createSelector(
    selectUserEntities,
    (entities) => Object.values(entities || {}) // Handle potential undefined entities
);

// Selector to get a single user by their ID
export const selectUserById = createSelector(
    selectUserEntities,
    (state, userId) => userId, // Pass userId as an argument
    (entities, userId) => (entities ? entities[userId] : null) // Look up user by ID
);

// --- >> Selector needed for CourseDetailPage << ---
// Selector to get a user by ID (specifically for instructors)
// In this setup, it works exactly like selectUserById
export const selectInstructorById = createSelector(
    selectUserEntities, // Input: gets the user map { 'user-1': {...}, ... }
    (state, instructorId) => instructorId, // Input: gets the instructorId argument
    (entities, instructorId) => (entities ? entities[instructorId] : null) // Output: looks up the instructor's user data
);
// --- >> End Added Selector << ---


// Selector for loading status (optional but good practice)
export const getUsersStatus = (state) => state.users.status;

// Selector for errors (optional but good practice)
export const getUsersError = (state) => state.users.error;


// --- Step 5: Export the Reducer ---
export default usersSlice.reducer;

// --- Step 6: Export Actions (if any are defined in reducers) ---
// Example: export const { userUpdated } = usersSlice.actions;