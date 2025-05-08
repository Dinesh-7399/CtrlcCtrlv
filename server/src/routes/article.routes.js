// server/src/routes/article.routes.js

import { Router } from 'express';
import { param, query } from 'express-validator'; // Added query for pagination
import {
    getAllPublishedArticles,
    getArticleBySlug
} from '../controllers/articleController.js'; // Controller functions

const router = Router();

// Validation for public article slug
const publicArticleSlugValidation = [
    param('slug').notEmpty().withMessage('Article slug cannot be empty.')
        .isString().withMessage('Article slug must be a string.')
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('Article slug is not in a valid format.')
];

// Validation for pagination query parameters
const paginationValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.')
];

// --- Public Article Routes ---

// GET /api/articles - List all PUBLISHED articles with pagination
router.get('/', paginationValidation, getAllPublishedArticles);

// GET /api/articles/:slug - Get details for a single PUBLISHED article
router.get(
    '/:slug',
    publicArticleSlugValidation,
    getArticleBySlug
);

export default router;