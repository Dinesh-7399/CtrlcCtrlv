// server/src/routes/course.routes.js
import express from 'express';
import { param, query } from 'express-validator';
import { Difficulty } from '@prisma/client'; // Assuming Difficulty is directly under @prisma/client
import {
  getAllPublishedCourses,
  getCourseBySlugOrId,
  getCourseReviews, // Import the new controller
} from '../controllers/courseController.js';
import { getLessonDetails } from '../controllers/lessonController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---
const getAllCoursesQueryValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be an integer between 1 and 100.'),
  query('category').optional().isString().trim().escape(),
  query('searchTerm').optional().isString().trim(), // No escape on searchTerm for broader matching
  query('language').optional().isString().trim().escape(),
  query('sortBy').optional().isString().trim().escape()
    .custom(value => {
      const allowedSorts = [
        'createdAt_asc', 'createdAt_desc',
        'price_asc', 'price_desc',
        'title_asc', 'title_desc', // Ensure your controller handles case-insensitive for title sort
        'updatedAt_asc', 'updatedAt_desc',
        'rating_desc' // Controller warns if not fully implemented
      ];
      if (!allowedSorts.includes(value)) {
        throw new Error(`Invalid sortBy value. Allowed: ${allowedSorts.join(', ')}`);
      }
      return true;
    }),
  query('difficulty').optional().toUpperCase().custom((value) => {
    if (value === undefined || value === null || value === '') return true; // Allow empty value to mean no filter
    // Ensure Difficulty enum is loaded and is an object
    if (!Difficulty || typeof Difficulty !== 'object' || Object.keys(Difficulty).length === 0) {
        // This console log helps during development if the enum isn't loading as expected
        console.error("RUNTIME VALIDATION CHECK: Difficulty enum is not available or empty.");
        throw new Error('Server configuration error: Difficulty levels are currently unavailable for validation.');
    }
    const validDifficulties = Object.values(Difficulty);
    if (!validDifficulties.includes(value)) {
        throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
    }
    return true;
  }),
];

const getCourseByIdentifierValidation = [
  param('identifier').isString().trim().notEmpty().withMessage('Course identifier is required.'),
  // Consider adding length or regex validation if your slugs/IDs have a pattern
];

const getLessonAccessValidation = [
  param('courseIdentifier').isString().trim().notEmpty().withMessage('Course identifier is required.'),
  param('lessonIdentifier').isString().trim().notEmpty().withMessage('Lesson identifier is required.'),
];

// Validation for the new Get Course Reviews route
const getCourseReviewsValidation = [
  param('courseId')
    .trim()
    .notEmpty().withMessage('Course ID parameter is required.')
    .isNumeric().withMessage('Course ID must be a numeric value.')
    .toInt(), // Converts to integer, important for Prisma if ID is Int
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page number must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be an integer between 1 and 50.') // Max 50 reviews per page
    .toInt(),
];


// --- Route Definitions ---
router.get(
  '/',
  getAllCoursesQueryValidation, // Pass the array of validation middlewares
  handleValidationErrors,
  getAllPublishedCourses
);

router.get(
  '/:identifier',
  authMiddleware(true), // Optional authentication
  getCourseByIdentifierValidation, // Pass the array of validation middlewares
  handleValidationErrors,
  getCourseBySlugOrId
);

// --- NEW ROUTE FOR COURSE REVIEWS ---
router.get(
  '/:courseId/reviews',
  getCourseReviewsValidation,   // Pass the array of validation middlewares
  handleValidationErrors,
  getCourseReviews
);
// Note: Reviews are typically public. If auth is needed for some reason, add authMiddleware(true).

router.get(
  '/:courseIdentifier/lessons/:lessonIdentifier',
  authMiddleware(true), // Requires authentication
  getLessonAccessValidation, // Pass the array of validation middlewares
  handleValidationErrors,
  getLessonDetails
);

export default router;