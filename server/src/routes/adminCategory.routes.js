// server/src/routes/adminCategory.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createCategory,
  getAllCategoriesForAdmin,
  getCategoryByIdForAdmin,
  updateCategory,
  deleteCategory,
} from '../controllers/adminCategoryController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

const categoryIdValidation = [
  param('categoryId').isInt({ gt: 0 }).withMessage('Category ID must be a positive integer.'),
];

const categoryBodyValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters.'),
  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),
  body('icon')
    .optional({ checkFalsy: true })
    .trim()
    .isString().withMessage('Icon name must be a string.')
    .isLength({ max: 50 }).withMessage('Icon name cannot exceed 50 characters.'),
  body('slug') // For manual slug override during update or optional create
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isSlug().withMessage('Slug can only contain lowercase letters, numbers, and hyphens.')
    .isLength({ min: 2, max: 100 }).withMessage('Slug must be between 2 and 100 characters.'),
];

const getAllCategoriesAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['name_asc', 'name_desc', 'courses_asc', 'courses_desc', 'newest', 'oldest']),
];


// --- Route Definitions ---

/**
 * @route   POST /api/admin/categories
 * @desc    Admin: Create a new category
 * @access  Private (Admin)
 */
router.post('/', categoryBodyValidation, handleValidationErrors, createCategory);

/**
 * @route   GET /api/admin/categories
 * @desc    Admin: Get all categories (with filters and pagination)
 * @access  Private (Admin)
 */
router.get('/', getAllCategoriesAdminValidation, handleValidationErrors, getAllCategoriesForAdmin);

/**
 * @route   GET /api/admin/categories/:categoryId
 * @desc    Admin: Get a single category by ID for editing
 * @access  Private (Admin)
 */
router.get('/:categoryId', categoryIdValidation, handleValidationErrors, getCategoryByIdForAdmin);

/**
 * @route   PUT /api/admin/categories/:categoryId
 * @desc    Admin: Update an existing category
 * @access  Private (Admin)
 */
router.put('/:categoryId', categoryIdValidation, categoryBodyValidation, handleValidationErrors, updateCategory);

/**
 * @route   DELETE /api/admin/categories/:categoryId
 * @desc    Admin: Delete a category
 * @access  Private (Admin)
 */
router.delete('/:categoryId', categoryIdValidation, handleValidationErrors, deleteCategory);

export default router;
