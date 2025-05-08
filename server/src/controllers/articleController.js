// server/src/controllers/articleController.js

import prisma from '../config/db.js'; // Verify this path
import { validationResult } from 'express-validator';

/**
 * @description Get ALL PUBLISHED articles with pagination
 * @route GET /api/articles
 * @access Public
 */
export const getAllPublishedArticles = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '9', 10);
    const skip = (page - 1) * limit;

    try {
        const [articles, totalCount] = await prisma.$transaction([
            prisma.article.findMany({
                where: { published: true },
                skip: skip,
                take: limit,
                select: {
                    id: true, title: true, slug: true, excerpt: true, thumbnailUrl: true, publishedAt: true,
                    author: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                    category: { select: { name: true, slug: true } }
                },
                orderBy: { publishedAt: 'desc' }, // Or createdAt
            }),
            prisma.article.count({ where: { published: true } })
        ]);

        res.status(200).json({
             message: 'Published articles retrieved successfully.',
             data: articles,
             pagination: {
                 currentPage: page,
                 totalPages: Math.ceil(totalCount / limit),
                 totalArticles: totalCount,
                 pageSize: limit
             }
         });
    } catch (error) {
        console.error("Error fetching published articles:", error);
        next(error);
    }
};

/**
 * @description Get a single PUBLISHED article by its slug
 * @route GET /api/articles/:slug
 * @access Public
 */
export const getArticleBySlug = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const { slug } = req.params;

    try {
        const article = await prisma.article.findUnique({
            where: { slug: slug, published: true },
            include: {
                author: {
                    select: {
                        id: true, name: true,
                        profile: { select: { headline: true, bio: true, avatarUrl: true, socialLinks: true } }
                    }
                },
                category: { select: { name: true, slug: true } }
            }
        });

        if (!article) {
            return res.status(404).json({ message: `Article with slug '${slug}' not found or is not published.` });
        }
        res.status(200).json(article);
    } catch (error) {
        console.error(`Error fetching article by slug '${slug}':`, error);
        next(error);
    }
};