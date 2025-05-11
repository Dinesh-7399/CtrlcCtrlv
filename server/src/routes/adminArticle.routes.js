// server/src/routes/adminArticle.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createArticle,
  getAllArticlesForAdmin,
  getArticleByIdForAdmin,
  updateArticle,
  deleteArticle,
} from '../controllers/adminArticleController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

const articleIdValidation = [
  param('articleId').isInt({ gt: 0 }).withMessage('Article ID must be a positive integer.'),
];

const articleBodyValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Article title is required.')
    .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters.'),
  body('content')
    .trim()
    .notEmpty().withMessage('Article content is required.')
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters long.'),
  body('excerpt')
    .optional({ checkFalsy: true }) // Allow empty string to be considered "not present" for optional
    .trim()
    .isLength({ max: 500 }).withMessage('Excerpt cannot exceed 500 characters.'),
  body('thumbnailUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid thumbnail URL format.'),
  body('categoryId')
    .optional({ checkFalsy: true }) // Allow null or empty string for unsetting
    .isInt({ gt: 0 }).withMessage('Category ID must be a positive integer if provided.'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array.')
    .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.trim() !== ''))
    .withMessage('All tags must be non-empty strings.'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']).withMessage('Invalid article status. Must be DRAFT, PUBLISHED, or ARCHIVED.'),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean value (true or false).'),
  body('publishedAt')
    .optional({ checkFalsy: true })
    .isISO8601().toDate().withMessage('Invalid publishedAt date format.'),
  body('slug') // For manual slug override during update
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isSlug().withMessage('Slug can only contain lowercase letters, numbers, and hyphens.')
    .isLength({ min: 3, max: 255 }).withMessage('Slug must be between 3 and 255 characters.'),
];

const getAllArticlesAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']).withMessage('Invalid status filter.'),
    query('categoryId').optional().isInt({ gt: 0 }).withMessage('Category ID filter must be a positive integer.'),
    query('authorId').optional().isInt({ gt: 0 }).withMessage('Author ID filter must be a positive integer.'),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['newest', 'oldest', 'title_asc', 'title_desc', 'updated_asc', 'updated_desc']),
];


// --- Route Definitions ---

/**
 * @route   POST /api/admin/articles
 * @desc    Admin: Create a new article
 * @access  Private (Admin)
 */
router.post('/', articleBodyValidation, handleValidationErrors, createArticle);

/**
 * @route   GET /api/admin/articles
 * @desc    Admin: Get all articles (all statuses, with filters)
 * @access  Private (Admin)
 */
router.get('/', getAllArticlesAdminValidation, handleValidationErrors, getAllArticlesForAdmin);

/**
 * @route   GET /api/admin/articles/:articleId
 * @desc    Admin: Get a single article by ID for editing
 * @access  Private (Admin)
 */
router.get('/:articleId', articleIdValidation, handleValidationErrors, getArticleByIdForAdmin);

/**
 * @route   PUT /api/admin/articles/:articleId
 * @desc    Admin: Update an article
 * @access  Private (Admin)
 */
router.put('/:articleId', articleIdValidation, articleBodyValidation, handleValidationErrors, updateArticle);

/**
 * @route   DELETE /api/admin/articles/:articleId
 * @desc    Admin: Delete an article
 * @access  Private (Admin)
 */
router.delete('/:articleId', articleIdValidation, handleValidationErrors, deleteArticle);

export default router;
