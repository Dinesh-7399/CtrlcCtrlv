// server/src/routes/adminArticle.routes.js

import { Router } from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js'; // Adjust the import path as needed
import {
    adminGetAllArticles,
    adminGetArticleById,
    adminCreateArticle,
    adminUpdateArticle,
    adminDeleteArticle
} from '../controllers/adminArticleController.js'; // We'll ensure this controller is fully implemented

const router = Router();

// --- Validation Middleware for Route Parameters ---
const articleIdParamValidation = [
    param('articleId')
        .isInt({ gt: 0 }).withMessage('Article ID must be a positive integer.')
        .toInt() // Convert to integer for the controller
];

// --- Validation Middleware for Request Body (Create & Update) ---
const articleBodyValidation = [
    body('title').trim().notEmpty().withMessage('Title is required.')
        .isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters.'),
    body('content').trim().notEmpty().withMessage('Content is required.')
        .isLength({ min: 50 }).withMessage('Content must be at least 50 characters.'),
    body('excerpt').optional({ checkFalsy: true }).trim()
        .isLength({ max: 500 }).withMessage('Excerpt cannot exceed 500 characters.'),
    body('thumbnailUrl').optional({ checkFalsy: true }).isURL().withMessage('Thumbnail URL must be a valid URL if provided.'),
    body('categoryId')
        .optional({ nullable: true })
        .if(value => value !== null && value !== undefined && value !== '')
        .isInt({ gt: 0 }).withMessage('Category ID must be a positive integer if provided.')
        .toInt(),
    body('authorId') // Admin can assign/change author for articles
        .optional({ nullable: true })
        .if(value => value !== null && value !== undefined && value !== '')
        .isInt({ gt: 0 }).withMessage('Author ID must be a positive integer if provided.')
        .toInt(),
    body('published').optional().isBoolean().withMessage('Published status must be true or false.').toBoolean(),
    body('slug')
        .optional({ checkFalsy: true })
        .trim()
        .isSlug()
        .withMessage('Slug can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen.')
        .isLength({ min: 3, max: 255 }).withMessage('Slug must be between 3 and 255 characters if provided.')
];

// --- Validation Middleware for Pagination Query ---
const adminPaginationValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
    query('status').optional().isIn(['published', 'draft']).withMessage("Status filter must be 'published' or 'draft'."),
    query('categoryId').optional().isInt({ gt: 0 }).withMessage('Category ID filter must be a positive integer.').toInt(),
    query('search').optional().isString().trim(),
    query('sortBy').optional().isIn(['title', 'createdAt', 'updatedAt', 'publishedAt']).withMessage("Invalid sortBy field for articles."),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage("Sort order must be 'asc' or 'desc'.")
];


// --- Admin Article Routes (ALL require Admin access) ---

// GET /api/admin/articles - List ALL articles (drafts and published)
router.get(
    '/',
    requireAuth,
    requireAdmin,
    adminPaginationValidation,
    adminGetAllArticles
);

// POST /api/admin/articles - Create a new article
router.post(
    '/',
    requireAuth,
    requireAdmin,
    articleBodyValidation,
    adminCreateArticle
);

// GET /api/admin/articles/:articleId - Get a specific article (for editing)
router.get(
    '/:articleId',
    requireAuth,
    requireAdmin,
    articleIdParamValidation,
    adminGetArticleById
);

// PUT /api/admin/articles/:articleId - Update an article
router.put(
    '/:articleId',
    requireAuth,
    requireAdmin,
    articleIdParamValidation,
    articleBodyValidation,
    adminUpdateArticle
);

// DELETE /api/admin/articles/:articleId - Delete an article
router.delete(
    '/:articleId',
    requireAuth,
    requireAdmin,
    articleIdParamValidation,
    adminDeleteArticle
);

export default router;