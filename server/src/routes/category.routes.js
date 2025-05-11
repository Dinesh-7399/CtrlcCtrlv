// server/src/routes/category.routes.js
import express from 'express';
import { param, query } from 'express-validator'; // For validating URL and query params
import {
  getAllCategories,
  getCategoryBySlugOrId,
} from '../controllers/categoryController.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---

const getCategoryBySlugOrIdValidation = [
  param('slugOrId')
    .notEmpty().withMessage('Category slug or ID is required.')
    .isString()
    .custom((value) => {
      // Check if it's a valid slug (lowercase, numbers, hyphens) OR a positive integer string
      const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
      const isNumericId = /^\d+$/.test(value) && parseInt(value, 10) > 0;
      if (isSlug || isNumericId) {
        return true;
      }
      throw new Error('Identifier must be a valid slug or a positive numeric ID.');
    }),
];

// Optional: Validation for getAllCategories if you add query params like pagination
const getAllCategoriesValidation = [
    // query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    // query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];


// --- Route Definitions ---

/**
 * @route   GET /api/categories
 * @desc    Get all categories (for public display)
 * @access  Public
 */
router.get(
  '/',
  getAllCategoriesValidation, // Add if query params are implemented
  handleValidationErrors,     // Add if query params are implemented
  getAllCategories
);

/**
 * @route   GET /api/categories/:slugOrId
 * @desc    Get a single category by its slug or ID
 * @access  Public
 */
router.get(
  '/:slugOrId',
  getCategoryBySlugOrIdValidation,
  handleValidationErrors,
  getCategoryBySlugOrId
);

// You could add other public category-related routes here if needed,
// for example, to get top categories or categories with the most courses.

export default router;
