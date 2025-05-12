// server/src/routes/article.routes.js
import express from 'express';
import { param, query } from 'express-validator';
import {
  getAllPublishedArticles,
  getArticleBySlug,
} from '../controllers/articleController.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js'; // Ensure this middleware exists and works

const router = express.Router();

const getArticlesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be an integer between 1 and 50.')
    .toInt(),
  query('category')
    .optional()
    .isString().withMessage('Category must be a string.')
    .trim()
    .isSlug().withMessage('Category slug format is invalid.'),
  query('tag')
    .optional()
    .isString().withMessage('Tag must be a string.')
    .trim()
    .isSlug().withMessage('Tag slug format is invalid.'),
  query('searchTerm')
    .optional()
    .isString().withMessage('Search term must be a string.')
    .trim(),
  query('sortBy')
    .optional()
    .isString().withMessage('SortBy parameter must be a string.')
    .trim()
    .isIn(['publishedAt_desc', 'publishedAt_asc', 'title_asc', 'title_desc', 'viewCount_desc', 'createdAt_desc'])
    .withMessage('Invalid sortBy option. Allowed: publishedAt_desc/asc, title_asc/desc, viewCount_desc, createdAt_desc.'),
];

const getArticleBySlugValidation = [
  param('articleSlug')
    .notEmpty().withMessage('Article slug parameter is required.')
    .isString()
    .isSlug().withMessage('Article slug format is invalid (e.g., use-lowercase-and-hyphens).'),
];

router.get(
  '/',
  getArticlesValidation,
  handleValidationErrors, // This middleware should call next(error) if validation fails
  getAllPublishedArticles
);

router.get(
  '/:articleSlug',
  getArticleBySlugValidation,
  handleValidationErrors,
  getArticleBySlug
);

export default router;