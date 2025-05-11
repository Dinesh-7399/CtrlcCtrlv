// server/src/routes/doubt.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createDoubt,
  getAllDoubts,
  getDoubtById,
  postMessageToDoubt,
  // Admin specific doubt controllers are in adminDoubtController.js
} from '../controllers/doubtController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { DoubtStatus } from '@prisma/client'; // For validating status query param

const router = express.Router();

// --- Validation Rules ---

const doubtIdValidation = [
  param('doubtId').isInt({ gt: 0 }).withMessage('Doubt ID must be a positive integer.'),
];

const createDoubtValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Doubt title is required.')
    .isLength({ min: 10, max: 200 }).withMessage('Title must be between 10 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Doubt description is required.')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters long.'),
  body('courseId')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer if provided.'),
  body('lessonId')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 }).withMessage('Lesson ID must be a positive integer if provided.'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array.')
    .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.trim() !== '' && tag.length <= 50))
    .withMessage('All tags must be non-empty strings, up to 50 characters each.'),
];

const postMessageValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Message content cannot be empty.')
    .isLength({ min: 1, max: 5000 }).withMessage('Message content must be between 1 and 5000 characters.'),
];

const getAllDoubtsValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
    query('courseId').optional().isInt({ gt: 0 }).withMessage('Course ID filter must be a positive integer.'),
    query('lessonId').optional().isInt({ gt: 0 }).withMessage('Lesson ID filter must be a positive integer.'),
    query('userId').optional().isInt({ gt: 0 }).withMessage('User ID filter must be a positive integer.'),
    query('status').optional().isIn(Object.values(DoubtStatus)).withMessage('Invalid status filter.'),
    query('tags').optional().isString().customSanitizer(value => value.split(',').map(tag => tag.trim()).filter(Boolean)), // Sanitize to array
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['newest', 'oldest', 'lastUpdated' /*, 'mostMessages', 'unanswered' */]),
];


// --- Route Definitions ---

/**
 * @route   POST /api/doubts
 * @desc    Create a new doubt/question
 * @access  Private (Authenticated users)
 */
router.post('/', authMiddleware, createDoubtValidation, handleValidationErrors, createDoubt);

/**
 * @route   GET /api/doubts
 * @desc    Get all doubts (with filtering and pagination)
 * @access  Public (or Private, depending on your platform's policy for viewing Q&A)
 * For now, let's make it require auth to view the list.
 */
router.get('/', authMiddleware, getAllDoubtsValidation, handleValidationErrors, getAllDoubts);

/**
 * @route   GET /api/doubts/:doubtId
 * @desc    Get a single doubt by its ID, including its messages
 * @access  Private (Authenticated users)
 */
router.get('/:doubtId', authMiddleware, doubtIdValidation, handleValidationErrors, getDoubtById);

/**
 * @route   POST /api/doubts/:doubtId/messages
 * @desc    Post a message to a doubt thread
 * @access  Private (Authenticated users - controller further checks if user can post to this specific doubt)
 */
router.post('/:doubtId/messages', authMiddleware, doubtIdValidation, postMessageValidation, handleValidationErrors, postMessageToDoubt);

// Note: Admin actions for doubts (update status, assign instructor, delete) are in adminDoubt.routes.js

export default router;
