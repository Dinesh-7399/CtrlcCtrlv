// server/src/routes/article.routes.js
import express from 'express';
import { param, query } from 'express-validator';
import {
  getAllPublishedArticles,
  getArticleBySlug,
} from '../controllers/articleController.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---

const getArticlesValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
  query('category').optional().isString().trim().isSlug().withMessage('Category slug contains invalid characters.'),
  query('tag').optional().isString().trim().isSlug().withMessage('Tag contains invalid characters.'),
  query('searchTerm').optional().isString().trim(),
  query('sortBy').optional().isString().isIn(['publishedAt_desc', 'publishedAt_asc', 'title_asc', 'title_desc', 'viewCount_desc'])
    .withMessage('Invalid sort option.'),
];

const getArticleBySlugValidation = [
  param('articleSlug')
    .notEmpty().withMessage('Article slug is required.')
    .isString()
    .isSlug().withMessage('Article slug contains invalid characters.'),
];

// --- Route Definitions ---

/**
 * @route   GET /api/articles
 * @desc    Get all published articles with pagination and filtering
 * @access  Public
 */
router.get('/', getArticlesValidation, handleValidationErrors, getAllPublishedArticles);

/**
 * @route   GET /api/articles/slug/:articleSlug
 * @desc    Get a single published article by its slug
 * @access  Public
 */
router.get('/:articleSlug', getArticleBySlugValidation, handleValidationErrors, getArticleBySlug);

// Potential future route:
// GET /api/articles/tags - to get a list of all unique tags used in published articles
// GET /api/articles/popular - to get most viewed/commented articles

export default router;
