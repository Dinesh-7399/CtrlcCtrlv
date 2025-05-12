// server/src/routes/adminArticle.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
// Import enums directly
import { ContentStatus } from '@prisma/client'; // Assuming ContentStatus is defined in your Prisma schema
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

router.use(authMiddleware(), adminMiddleware);

const articleIdValidation = [
  param('articleId').isInt({ gt: 0 }).withMessage('Article ID must be a positive integer.'),
];

const articleBodyValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Article title is required.')
    .isLength({ min: 5, max: 255 }).withMessage('Title must be between 5 and 255 characters.'),
  body('content')
    .trim()
    .notEmpty().withMessage('Article content is required.')
    .isLength({ min: 20 }).withMessage('Content must be at least 20 characters long.'),
  body('excerpt')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Excerpt cannot exceed 500 characters.'),
  body('status')
    .optional()
    .toUpperCase() // Ensure it's uppercase for comparison with enum values
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (!ContentStatus || typeof ContentStatus !== 'object') {
        console.error("VALIDATOR RUNTIME CHECK (Direct Import): ContentStatus enum is NOT available.");
        throw new Error('Server configuration error: Content statuses unavailable for validation.');
      }
      const validStatuses = Object.values(ContentStatus);
      if (!validStatuses.includes(value)) {
        throw new Error(`Invalid article status. Must be one of: ${validStatuses.join(', ')}`);
      }
      return true;
    }),
  body('categoryId')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 }).withMessage('Category ID must be a positive integer if provided.')
    .toInt(),
  body('tags') // Assuming tags are sent as an array of strings or comma-separated string
    .optional()
    .custom((value) => {
        if (Array.isArray(value)) {
            return value.every(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50);
        }
        if(typeof value === 'string' && value.trim() !== '') {
            return value.split(',').every(tag => tag.trim().length > 0 && tag.trim().length <= 50);
        }
        return true; // allow empty
    }).withMessage('Tags must be valid strings, each not exceeding 50 characters.'),
  body('slug')
    .optional({ checkFalsy: true })
    .isString().trim().isSlug().withMessage('Slug can only contain lowercase letters, numbers, and hyphens.')
    .isLength({ min: 3, max: 255 }).withMessage('Slug must be between 3 and 255 characters.'),
  body('featuredImage')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid URL for featured image.'),
];

const getAllArticlesAdminValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
  query('status').optional().toUpperCase().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (!ContentStatus || typeof ContentStatus !== 'object') {
        throw new Error('Server configuration error: Content statuses unavailable for query validation.');
    }
    const validStatuses = Object.values(ContentStatus);
    if (!validStatuses.includes(value)) {
        throw new Error(`Invalid status filter. Must be one of: ${validStatuses.join(', ')}`);
    }
    return true;
  }),
  query('categoryId').optional().isInt({ gt: 0 }).withMessage('Category ID filter must be a positive integer.').toInt(),
  query('searchTerm').optional().isString().trim(),
  query('sortBy').optional().isString().trim().isIn(['createdAt_desc', 'createdAt_asc', 'title_asc', 'title_desc', 'updatedAt_desc'])
    .withMessage('Invalid sort option.'),
];

// --- Route Definitions ---
router.post('/', articleBodyValidation, handleValidationErrors, createArticle);
router.get('/', getAllArticlesAdminValidation, handleValidationErrors, getAllArticlesForAdmin);
router.get('/:articleId', articleIdValidation, handleValidationErrors, getArticleByIdForAdmin);
router.put('/:articleId', articleIdValidation, articleBodyValidation, handleValidationErrors, updateArticle);
router.delete('/:articleId', articleIdValidation, handleValidationErrors, deleteArticle);

export default router;