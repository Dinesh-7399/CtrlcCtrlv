// server/src/controllers/articleController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator'; // For potential future validation on query params

const ARTICLES_PER_PAGE = 10; // Default number of articles per page

/**
 * @desc    Get all published articles with pagination
 * @route   GET /api/articles
 * @access  Public
 */
export const getAllPublishedArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ARTICLES_PER_PAGE;
    const skip = (page - 1) * limit;

    // TODO: Add filtering by category, tags, or search term in the future
    // const { category, tag, searchTerm } = req.query;
    // let whereClause = { status: 'PUBLISHED' };
    // if (category) { whereClause.categoryId = parseInt(category); } // Assuming category is ID
    // if (tag) { whereClause.tags = { has: tag }; }
    // if (searchTerm) { whereClause.OR = [ { title: { contains: searchTerm, mode: 'insensitive' } }, { excerpt: { contains: searchTerm, mode: 'insensitive' } } ]; }

    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED', // Only fetch published articles
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        thumbnailUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: { // Fetch avatar from profile
              select: {
                avatarUrl: true,
              }
            }
          },
        },
        category: { // Include category name
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        tags: true,
        publishedAt: true,
        readTime: true,
        viewCount: true,
        createdAt: true, // For sorting by newest if needed on client
      },
      orderBy: {
        publishedAt: 'desc', // Default sort by most recently published
      },
      skip: skip,
      take: limit,
    });

    const totalArticles = await prisma.article.count({
      where: {
        status: 'PUBLISHED',
        // Add same whereClause here if filtering is implemented
      },
    });

    const totalPages = Math.ceil(totalArticles / limit);

    // Format author data slightly
    const formattedArticles = articles.map(article => ({
      ...article,
      author: {
        id: article.author.id,
        name: article.author.name,
        avatarUrl: article.author.profile?.avatarUrl || null
      }
    }));


    return res.status(200).json(
      new ApiResponse(
        200,
        {
          articles: formattedArticles,
          currentPage: page,
          totalPages,
          totalArticles,
        },
        'Published articles fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching published articles:', error);
    next(new ApiError(500, 'Failed to fetch articles.', [error.message]));
  }
};

/**
 * @desc    Get a single published article by its slug
 * @route   GET /api/articles/slug/:articleSlug
 * @access  Public
 */
export const getArticleBySlug = async (req, res, next) => {
  try {
    const { articleSlug } = req.params;

    if (!articleSlug) {
      return next(new ApiError(400, 'Article slug is required.'));
    }

    const article = await prisma.article.findUnique({
      where: {
        slug: articleSlug,
        status: 'PUBLISHED', // Ensure only published articles are fetched publicly
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true, // Full content for detail view
        excerpt: true,
        thumbnailUrl: true,
        author: {
          select: {
            id: true,
            name: true,
            profile: {
              select: {
                avatarUrl: true,
                headline: true, // Include instructor headline
                socialLinks: true,
              }
            }
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        tags: true,
        publishedAt: true,
        readTime: true,
        viewCount: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!article) {
      return next(new ApiError(404, `Article with slug '${articleSlug}' not found or not published.`));
    }

    // Increment view count (fire and forget, don't let it block the response)
    prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    }).catch(viewCountError => {
      // Log error but don't fail the main request for this
      console.error(`Failed to increment view count for article ${article.id}:`, viewCountError);
    });
    
    // Format author data
    const formattedArticle = {
      ...article,
      author: {
        id: article.author.id,
        name: article.author.name,
        avatarUrl: article.author.profile?.avatarUrl || null,
        headline: article.author.profile?.headline || null,
        socialLinks: article.author.profile?.socialLinks || null,
      }
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { article: formattedArticle }, 'Article fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching article by slug '${req.params.articleSlug}':`, error);
    // Handle potential Prisma errors like if a field in 'select' doesn't exist
    if (error.code === 'P2025' || error.code === 'P2023') { // Prisma specific error codes for record not found or invalid ID format
        return next(new ApiError(404, `Article with slug '${req.params.articleSlug}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch article.', [error.message]));
  }
};
