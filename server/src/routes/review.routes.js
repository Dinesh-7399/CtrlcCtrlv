// server/src/routes/course.routes.js
import express from 'express';
import { param, query, body } from 'express-validator'; // Added body
import {
  getAllPublishedCourses,
  getCourseBySlugOrId,
} from '../controllers/courseController.js';
import { getLessonDetails } from '../controllers/lessonController.js';

// --- IMPORT REVIEW CONTROLLER FUNCTIONS ---
import { getCourseReviews, upsertCourseReview } from '../controllers/reviewController.js';

import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { enrollmentCheckMiddleware } from '../middlewares/enrollmentCheckMiddleware.js';

// --- IMPORT PRISMA ENUMS DIRECTLY FOR VALIDATION ---
import { Difficulty, ContentStatus } from '@prisma/client'; // Add other enums if used by validations in this file

const router = express.Router();

// --- Validation Rules for this router ---
const getAllCoursesQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.').toInt(),
  query('category').optional().isString().trim().isSlug().withMessage('Category slug contains invalid characters.'),
  query('searchTerm').optional().isString().trim(),
  query('difficulty').optional().toUpperCase().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    // Use directly imported Enum
    if (!Difficulty || typeof Difficulty !== 'object') {
        console.error("VALIDATOR RUNTIME CHECK: Difficulty enum is NOT directly available.");
        throw new Error('Server configuration error: Difficulty levels unavailable for validation.');
    }
    const validDifficulties = Object.values(Difficulty);
    if (!validDifficulties.includes(value)) throw new Error(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
    return true;
  }),
  query('language').optional().isString().trim(),
  query('sortBy').optional().isString().trim().isIn(['newest', 'createdAt_desc', 'price_asc', 'price_desc', 'title_asc', 'title_desc', 'rating_desc']) // Added createdAt_desc
    .withMessage('Invalid sort option.'),
];

const getCourseByIdentifierValidation = [ /* ... as before, no direct enum use typically ... */
  param('identifier')
    .notEmpty().withMessage('Course slug or ID is required.')
    .isString()
    .custom((value) => {
      const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
      const isNumericId = /^\d+$/.test(value) && parseInt(value, 10) > 0;
      if (isSlug || isNumericId) return true;
      throw new Error('Identifier must be a valid slug or a positive numeric ID.');
    }),
];
const getLessonAccessValidation = [ /* ... as before ... */ ];

// Validation for GET /api/courses/:courseId/reviews
const getCourseReviewsValidation = [
  param('courseId').isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.').toInt(),
  query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be an integer between 1 and 50.'),
];

// Validation for POST /api/courses/:courseId/reviews
const upsertReviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
  body('comment').optional({ checkFalsy: true }).isString().trim()
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters.'),
];


// --- Route Definitions ---
router.get('/', ...getAllCoursesQueryValidation, handleValidationErrors, getAllPublishedCourses);
router.get('/:identifier', authMiddleware(true), ...getCourseByIdentifierValidation, handleValidationErrors, getCourseBySlugOrId);

// --- Review Routes Nested Under Courses ---
router.get(
  '/:courseId/reviews',
  getCourseReviewsValidation,
  handleValidationErrors,
  getCourseReviews // From reviewController.js
);

router.post(
  '/:courseId/reviews',
  authMiddleware(), // Requires user to be logged in
  param('courseId').isInt({ gt: 0 }).withMessage('Course ID must be a positive integer in the path.').toInt(), // Validate param for middleware
  enrollmentCheckMiddleware, // Ensures user is enrolled in :courseId
  upsertReviewValidation,    // Validate request body
  handleValidationErrors,
  upsertCourseReview      // From reviewController.js
);

router.get('/:courseIdentifier/lessons/:lessonIdentifier', authMiddleware(true), ...getLessonAccessValidation, handleValidationErrors, getLessonDetails);

export default router;