// server/src/routes/note.routes.js
import express from 'express';
import { param, body } from 'express-validator';
import {
  getNoteForLesson,
  upsertNoteForLesson,
  deleteNoteForLesson,
} from '../controllers/noteController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { enrollmentCheckMiddleware } from '../middlewares/enrollmentCheckMiddleware.js'; // Assuming this middleware needs courseId
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for authenticated users
router.use(authMiddleware);

// --- Validation Rules ---

// As notes are tied to lessons, and lessons to courses, we need courseId for enrollment check.
// The route structure will reflect this: /api/notes/course/:courseId/lesson/:lessonId
const noteRouteParamsValidation = [
  param('courseId').isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.'),
  param('lessonId').isInt({ gt: 0 }).withMessage('Lesson ID must be a positive integer.'),
];

const upsertNoteValidation = [
  body('content')
    .isString().withMessage('Note content must be a string.')
    .trim()
    //.notEmpty().withMessage('Note content cannot be empty if provided.') // Allow empty string to clear note
    .isLength({ max: 10000 }).withMessage('Note content cannot exceed 10,000 characters.'), // Max length for notes
];


// --- Route Definitions ---

/**
 * @route   GET /api/notes/course/:courseId/lesson/:lessonId
 * @desc    Get the note for a specific lesson for the current user
 * @access  Private (Authenticated and Enrolled Users)
 */
router.get(
  '/course/:courseId/lesson/:lessonId',
  noteRouteParamsValidation,
  handleValidationErrors,
  enrollmentCheckMiddleware, // Ensures user is enrolled in the course
  getNoteForLesson
);

/**
 * @route   POST /api/notes/course/:courseId/lesson/:lessonId
 * @desc    Create or Update a note for a specific lesson for the current user
 * @access  Private (Authenticated and Enrolled Users)
 * @body    { content: string }
 */
router.post(
  '/course/:courseId/lesson/:lessonId', // Using POST for upsert is common
  noteRouteParamsValidation,
  upsertNoteValidation,
  handleValidationErrors,
  enrollmentCheckMiddleware, // Ensures user is enrolled in the course
  upsertNoteForLesson
);

/**
 * @route   DELETE /api/notes/course/:courseId/lesson/:lessonId
 * @desc    Delete a note for a specific lesson for the current user
 * @access  Private (Authenticated and Enrolled Users)
 */
router.delete(
  '/course/:courseId/lesson/:lessonId',
  noteRouteParamsValidation,
  handleValidationErrors,
  enrollmentCheckMiddleware, // Ensures user is enrolled in the course
  deleteNoteForLesson
);

export default router;
