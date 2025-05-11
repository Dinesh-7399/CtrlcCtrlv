// server/src/controllers/adminArticleController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';
import slugify from 'slugify'; // For generating slugs

const ARTICLES_PER_PAGE_ADMIN = 15;

/**
 * @desc    Create a new article
 * @route   POST /api/admin/articles
 * @access  Private (Admin)
 */
export const createArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const {
    title,
    content, // HTML content from Tiptap
    excerpt,
    thumbnailUrl,
    categoryId, // ID of the category
    tags,       // Array of strings
    status,     // DRAFT, PUBLISHED, ARCHIVED
    isFeatured,
    publishedAt, // Optional: can be set manually or when status becomes PUBLISHED
  } = req.body;

  const authorId = req.user.userId; // Admin creating the article is the author

  if (!title || !content) {
    return next(new ApiError(400, 'Title and content are required for an article.'));
  }

  try {
    let generatedSlug = slugify(title, { lower: true, strict: true, trim: true });
    // Ensure slug uniqueness
    let existingArticleWithSlug = await prisma.article.findUnique({ where: { slug: generatedSlug } });
    let counter = 1;
    while (existingArticleWithSlug) {
      generatedSlug = `${slugify(title, { lower: true, strict: true, trim: true })}-${counter}`;
      existingArticleWithSlug = await prisma.article.findUnique({ where: { slug: generatedSlug } });
      counter++;
    }

    const articleData = {
      title,
      slug: generatedSlug,
      content,
      excerpt: excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''), // Auto-generate excerpt if not provided
      thumbnailUrl,
      authorId,
      status: status || 'DRAFT', // Default to DRAFT
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false,
      tags: Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.trim() !== '') : [],
    };

    if (categoryId) {
      const numericCategoryId = parseInt(categoryId, 10);
      if (!isNaN(numericCategoryId)) {
        // Verify category exists
        const categoryExists = await prisma.category.findUnique({ where: { id: numericCategoryId } });
        if (categoryExists) {
          articleData.categoryId = numericCategoryId;
        } else {
          console.warn(`Category ID ${categoryId} not found, article will be created without category.`);
        }
      }
    }

    if (status === 'PUBLISHED' && !publishedAt) {
      articleData.publishedAt = new Date();
    } else if (publishedAt) {
      articleData.publishedAt = new Date(publishedAt);
    }


    const newArticle = await prisma.article.create({
      data: articleData,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { article: newArticle }, 'Article created successfully.'));

  } catch (error) {
    console.error('Error creating article:', error);
    next(new ApiError(500, 'Failed to create article.', [error.message]));
  }
};

/**
 * @desc    Get all articles (for admin view, includes drafts)
 * @route   GET /api/admin/articles
 * @access  Private (Admin)
 */
export const getAllArticlesForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ARTICLES_PER_PAGE_ADMIN;
    const skip = (page - 1) * limit;

    const { status, categoryId, authorId, searchTerm, sortBy = 'newest' } = req.query;

    let whereClause = {};
    if (status) whereClause.status = status.toUpperCase();
    if (categoryId) whereClause.categoryId = parseInt(categoryId, 10);
    if (authorId) whereClause.authorId = parseInt(authorId, 10);

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { has: searchTerm } }, // Search if searchTerm is one of the tags
      ];
    }

    let orderByClause = {};
    switch (sortBy) {
      case 'oldest': orderByClause = { createdAt: 'asc' }; break;
      case 'title_asc': orderByClause = { title: 'asc' }; break;
      case 'title_desc': orderByClause = { title: 'desc' }; break;
      case 'updated_asc': orderByClause = { updatedAt: 'asc' }; break;
      case 'updated_desc': orderByClause = { updatedAt: 'desc' }; break;
      case 'newest':
      default: orderByClause = { createdAt: 'desc' }; break;
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      select: {
        id: true, title: true, slug: true, status: true, thumbnailUrl: true,
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        publishedAt: true, createdAt: true, updatedAt: true, viewCount: true,
        _count: { select: { /* Add any counts needed, e.g., comments if you add them */ } }
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalArticles = await prisma.article.count({ where: whereClause });
    const totalPages = Math.ceil(totalArticles / limit);

    return res.status(200).json(
      new ApiResponse(200, { articles, currentPage: page, totalPages, totalArticles, }, 'Admin: Articles fetched successfully.')
    );
  } catch (error) {
    console.error('Error fetching articles for admin:', error);
    next(new ApiError(500, 'Failed to fetch articles for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single article by ID (for admin editing)
 * @route   GET /api/admin/articles/:articleId
 * @access  Private (Admin)
 */
export const getArticleByIdForAdmin = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const numericArticleId = parseInt(articleId, 10);

    if (isNaN(numericArticleId)) {
      return next(new ApiError(400, 'Invalid Article ID format.'));
    }

    const article = await prisma.article.findUnique({
      where: { id: numericArticleId },
      include: { // Include all necessary data for the edit form
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!article) {
      return next(new ApiError(404, `Article with ID ${numericArticleId} not found.`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { article }, 'Article details fetched for admin.'));
  } catch (error) {
    console.error(`Error fetching article ID '${req.params.articleId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch article details for admin.', [error.message]));
  }
};

/**
 * @desc    Update an article
 * @route   PUT /api/admin/articles/:articleId
 * @access  Private (Admin)
 */
export const updateArticle = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { articleId } = req.params;
  const numericArticleId = parseInt(articleId, 10);

  const {
    title, content, excerpt, thumbnailUrl, categoryId, tags, status, isFeatured, publishedAt, slug: newSlug // Allow manual slug override
  } = req.body;
  // authorId is not typically changed on update, it's the original author

  if (isNaN(numericArticleId)) {
    return next(new ApiError(400, 'Invalid Article ID format.'));
  }

  try {
    const existingArticle = await prisma.article.findUnique({ where: { id: numericArticleId } });
    if (!existingArticle) {
      return next(new ApiError(404, `Article with ID ${numericArticleId} not found.`));
    }

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;
    if (excerpt !== undefined) dataToUpdate.excerpt = excerpt;
    if (thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = thumbnailUrl;
    if (tags !== undefined) dataToUpdate.tags = Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.trim() !== '') : existingArticle.tags;
    if (status !== undefined) dataToUpdate.status = status;
    if (typeof isFeatured === 'boolean') dataToUpdate.isFeatured = isFeatured;

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') { // Allow unsetting category
        dataToUpdate.categoryId = null;
      } else {
        const numericCatId = parseInt(categoryId, 10);
        if (!isNaN(numericCatId)) {
          const categoryExists = await prisma.category.findUnique({ where: { id: numericCatId } });
          if (categoryExists) dataToUpdate.categoryId = numericCatId;
          else console.warn(`Update Article: Category ID ${numericCatId} not found. Category not changed.`);
        }
      }
    }

    // Handle slug: if title changes and no manual slug is provided, regenerate. If manual slug is provided, use it (ensure uniqueness).
    if (title && title !== existingArticle.title && !newSlug) {
      let generatedSlug = slugify(title, { lower: true, strict: true, trim: true });
      let existingArticleWithSlug = await prisma.article.findFirst({ where: { slug: generatedSlug, NOT: { id: numericArticleId } } });
      let counter = 1;
      while (existingArticleWithSlug) {
        generatedSlug = `${slugify(title, { lower: true, strict: true, trim: true })}-${counter}`;
        existingArticleWithSlug = await prisma.article.findFirst({ where: { slug: generatedSlug, NOT: { id: numericArticleId } } });
        counter++;
      }
      dataToUpdate.slug = generatedSlug;
    } else if (newSlug && newSlug !== existingArticle.slug) {
      const existingArticleWithNewSlug = await prisma.article.findFirst({ where: { slug: newSlug, NOT: { id: numericArticleId } } });
      if (existingArticleWithNewSlug) {
        return next(new ApiError(409, `Slug '${newSlug}' is already in use.`));
      }
      dataToUpdate.slug = newSlug;
    }

    // Handle publishedAt based on status
    if (status === 'PUBLISHED' && existingArticle.status !== 'PUBLISHED') {
      dataToUpdate.publishedAt = publishedAt ? new Date(publishedAt) : new Date(); // Set to now if not provided
    } else if (status !== 'PUBLISHED' && publishedAt) { // If manually setting publish date for a draft
      dataToUpdate.publishedAt = new Date(publishedAt);
    } else if (status !== 'PUBLISHED' && existingArticle.status === 'PUBLISHED') {
      // If unpublishing, you might want to nullify publishedAt or leave it as historical record
      // dataToUpdate.publishedAt = null; // Option 1: Clear it
    }


    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(200).json(new ApiResponse(200, { article: existingArticle }, 'No changes provided to update article.'));
    }

    const updatedArticle = await prisma.article.update({
      where: { id: numericArticleId },
      data: dataToUpdate,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { article: updatedArticle }, 'Article updated successfully.'));

  } catch (error) {
    console.error(`Error updating article ID '${articleId}':`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) { // Unique constraint violation for slug
        return next(new ApiError(409, `The slug generated or provided is already in use.`));
    }
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Article with ID ${articleId} not found.`));
    }
    next(new ApiError(500, 'Failed to update article.', [error.message]));
  }
};

/**
 * @desc    Delete an article
 * @route   DELETE /api/admin/articles/:articleId
 * @access  Private (Admin)
 */
export const deleteArticle = async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const numericArticleId = parseInt(articleId, 10);

    if (isNaN(numericArticleId)) {
      return next(new ApiError(400, 'Invalid Article ID format.'));
    }

    // Check if article exists before trying to delete
    const articleExists = await prisma.article.findUnique({ where: { id: numericArticleId } });
    if (!articleExists) {
        return next(new ApiError(404, `Article with ID ${numericArticleId} not found.`));
    }

    await prisma.article.delete({
      where: { id: numericArticleId },
    });

    return res
      .status(200) // Or 204 No Content
      .json(new ApiResponse(200, null, 'Article deleted successfully.'));
  } catch (error) {
    console.error(`Error deleting article ID '${req.params.articleId}':`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return next(new ApiError(404, `Article with ID '${req.params.articleId}' not found.`));
    }
    next(new ApiError(500, 'Failed to delete article.', [error.message]));
  }
};
