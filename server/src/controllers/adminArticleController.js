// server/src/controllers/adminArticleController.js

import prisma from '../config/db.js'; // Verify this path (e.g., ../config/db.js or ../db/db.js)
import { validationResult } from 'express-validator';
import slugify from 'slugify'; // Ensure this is installed: npm install slugify

// --- Helper for Article Slug Generation ---
const generateUniqueArticleSlug = async (title, currentArticleId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  if (!baseSlug) { baseSlug = `article-${Date.now()}`; }
  let uniqueSlug = baseSlug;
  let counter = 1;
  let existingArticle;
  try {
    do {
      const whereClause = { slug: uniqueSlug };
      if (currentArticleId) { // For updates, exclude the current article from the check
        whereClause.NOT = { id: currentArticleId };
      }
      existingArticle = await prisma.article.findFirst({ where: whereClause });
      if (existingArticle) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    } while (existingArticle);
  } catch (error) {
    console.error("Error checking article slug uniqueness:", error);
    uniqueSlug = `${baseSlug}-${Date.now()}`; // Fallback in case of DB error
  }
  return uniqueSlug;
};

/**
 * @description Get ALL articles (drafts and published) for Admin view
 * @route GET /api/admin/articles
 * @access Private (Admin)
 */
export const adminGetAllArticles = async (req, res, next) => {
    const errors = validationResult(req); // Validate pagination queries from route
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // TODO: Add filtering by status, search by title for admin

    try {
        const [articles, totalCount] = await prisma.$transaction([
            prisma.article.findMany({
                skip: skip,
                take: limit,
                include: {
                    author: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } }
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.article.count() // Get total count of all articles
        ]);

        res.status(200).json({
             message: 'Admin: Articles retrieved successfully.',
             data: articles,
             pagination: {
                 currentPage: page,
                 totalPages: Math.ceil(totalCount / limit),
                 totalArticles: totalCount,
                 pageSize: limit
             }
         });
    } catch (error) {
        console.error("Admin Error fetching all articles:", error);
        next(error);
    }
};

/**
 * @description Get a specific article by ID (for admin editing)
 * @route GET /api/admin/articles/:articleId
 * @access Private (Admin)
 */
export const adminGetArticleById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const articleId = parseInt(req.params.articleId, 10);
    try {
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            include: { // Include details needed for editing form
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } }
            }
        });
        if (!article) {
            return res.status(404).json({ message: `Article with ID ${articleId} not found.` });
        }
        res.status(200).json(article);
    } catch (error) {
        console.error(`Admin Error fetching article ${articleId}:`, error);
        next(error);
    }
};

/**
 * @description Create a new article
 * @route POST /api/admin/articles
 * @access Private (Admin)
 */
export const adminCreateArticle = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const authorId = req.user.id; // Admin creating the article is the author
    const { title, content, excerpt, thumbnailUrl, categoryId, published, slug: userProvidedSlug } = req.body;

    let finalCategoryId = null;
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
        const parsedCategoryId = parseInt(categoryId, 10);
        if (isNaN(parsedCategoryId)) return res.status(400).json({ message: 'Invalid Category ID format.' });
        finalCategoryId = parsedCategoryId;
    }

    try {
        if (finalCategoryId) {
            const categoryExists = await prisma.category.findUnique({ where: { id: finalCategoryId } });
            if (!categoryExists) return res.status(400).json({ message: `Category with ID ${finalCategoryId} not found.` });
        }

        let slug = userProvidedSlug ? slugify(userProvidedSlug, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) : await generateUniqueArticleSlug(title);
        if (userProvidedSlug) { // If user provided slug, check its uniqueness
            const existingSlug = await prisma.article.findUnique({where: {slug}});
            if(existingSlug) {
                return res.status(409).json({ message: `Conflict: Slug "${slug}" is already in use.` });
            }
        }


        const articleData = {
            title,
            slug,
            content,
            excerpt: excerpt || content.substring(0, 150) + (content.length > 150 ? '...' : ''),
            thumbnailUrl: thumbnailUrl || null,
            authorId,
            categoryId: finalCategoryId,
            published: published === true || published === 'true',
            publishedAt: (published === true || published === 'true') ? new Date() : null,
        };

        const newArticle = await prisma.article.create({
            data: articleData,
            include: { author: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } }
        });
        res.status(201).json({ message: 'Article created successfully.', article: newArticle });
    } catch (error) {
        console.error("Admin Error creating article:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
            return res.status(409).json({ message: 'Conflict: This slug is already in use. Try a different title or slug.' });
        }
        if (error.code === 'P2003') {
            const constraint = error.meta?.constraint || 'unknown foreign key';
            return res.status(400).json({ message: `Invalid input: Referenced data not found (${constraint}). Check authorId or categoryId.` });
        }
        next(error);
    }
};

/**
 * @description Update an article
 * @route PUT /api/admin/articles/:articleId
 * @access Private (Admin)
 */
export const adminUpdateArticle = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const articleId = parseInt(req.params.articleId, 10);
    const { title, content, excerpt, thumbnailUrl, categoryId, published, slug: reqSlug, authorId: newAuthorId } = req.body;

    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (reqSlug !== undefined) dataToUpdate.slug = slugify(reqSlug, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    if (content !== undefined) dataToUpdate.content = content;
    if (excerpt !== undefined) dataToUpdate.excerpt = excerpt;
    if (thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = thumbnailUrl;
    if (categoryId !== undefined) dataToUpdate.categoryId = categoryId ? parseInt(categoryId, 10) : null;
    if (published !== undefined) {
        dataToUpdate.published = Boolean(published === true || published === 'true');
        // Only set publishedAt if changing to published and it wasn't already set, or if unpublishing
        if (dataToUpdate.published && (!req.body.publishedAt || published === false) ) {
            dataToUpdate.publishedAt = dataToUpdate.published ? new Date() : null;
        } else if (published === false) {
            dataToUpdate.publishedAt = null;
        }
    }
    if (newAuthorId !== undefined) dataToUpdate.authorId = parseInt(newAuthorId, 10);

    try {
        // If title is being updated AND no explicit slug is provided, regenerate slug
        if (dataToUpdate.title && reqSlug === undefined) {
            const currentArticle = await prisma.article.findUnique({ where: { id: articleId }, select: { title: true }});
            if (currentArticle && currentArticle.title !== dataToUpdate.title) {
                dataToUpdate.slug = await generateUniqueArticleSlug(dataToUpdate.title, articleId);
            }
        } else if (dataToUpdate.slug) { // If slug IS provided, check uniqueness
            const existingSlug = await prisma.article.findFirst({ where: { slug: dataToUpdate.slug, NOT: { id: articleId } } });
            if (existingSlug) return res.status(409).json({ message: `Conflict: Slug "${dataToUpdate.slug}" is already in use.`});
        }

        if (dataToUpdate.categoryId !== undefined && dataToUpdate.categoryId !== null) {
            const categoryExists = await prisma.category.findUnique({ where: { id: dataToUpdate.categoryId }});
            if (!categoryExists) return res.status(400).json({ message: `Invalid input: Category ID ${dataToUpdate.categoryId} not found.`});
        }
        if (dataToUpdate.authorId !== undefined) {
            const authorExists = await prisma.user.findUnique({ where: { id: dataToUpdate.authorId }});
            if (!authorExists) return res.status(400).json({ message: `Invalid input: Author ID ${dataToUpdate.authorId} not found.`});
        }

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: dataToUpdate,
            include: { author: { select: { id: true, name: true } }, category: { select: { id: true, name: true } } }
        });
        res.status(200).json({ message: 'Article updated successfully.', article: updatedArticle });
    } catch (error) {
        console.error(`Admin Error updating article ${articleId}:`, error);
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) return res.status(409).json({ message: 'Conflict: Slug already in use.' });
        if (error.code === 'P2025') return res.status(404).json({ message: `Article with ID ${articleId} not found.` });
        if (error.code === 'P2003') {
             const constraint = error.meta?.constraint || 'unknown foreign key';
             return res.status(400).json({ message: `Invalid input: Referenced data not found (${constraint}). Check authorId or categoryId.` });
         }
        next(error);
    }
};

/**
 * @description Delete an article
 * @route DELETE /api/admin/articles/:articleId
 * @access Private (Admin)
 */
export const adminDeleteArticle = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const articleId = parseInt(req.params.articleId, 10);
    try {
        await prisma.article.delete({ where: { id: articleId } });
        res.status(200).json({ message: `Article with ID ${articleId} deleted successfully.` });
    } catch (error) {
        console.error(`Admin Error deleting article ${articleId}:`, error);
        if (error.code === 'P2025') return res.status(404).json({ message: `Article with ID ${articleId} not found.` });
        next(error);
    }
};