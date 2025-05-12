// server/src/controllers/articleController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

const ARTICLES_PER_PAGE = 10;

export const getAllPublishedArticles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ARTICLES_PER_PAGE;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'publishedAt_desc';

    let whereClause = {
      status: 'PUBLISHED',
    };

    const { category: categorySlug, tag: tagSlug, searchTerm } = req.query;

    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (category) {
        whereClause.categoryId = category.id;
      } else {
        return res.status(200).json(new ApiResponse(200, { articles: [], currentPage: 1, totalPages: 0, totalArticles: 0 }, 'No articles found for the specified category.'));
      }
    }

    if (tagSlug) {
      const tagExists = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tagExists) {
        // Correct way to filter by a many-to-many related tag's slug
        whereClause.new_tags_relation = { // <-- Use the correct relation field name
          some: {
            slug: tagSlug
          }
        };
      } else {
        return res.status(200).json(new ApiResponse(200, { articles: [], currentPage: 1, totalPages: 0, totalArticles: 0 }, 'No articles found for the specified tag.'));
      }
    }

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { excerpt: { contains: searchTerm, mode: 'insensitive' } },
        { author: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        // Correct way to search by a many-to-many related tag's name
        { new_tags_relation: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } } // <-- Use the correct relation field name
      ];
    }

    let orderByClause = {};
    const [sortField, sortOrderInput] = sortBy.split('_');
    const sortOrder = sortOrderInput?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    if (sortField === 'title') {
      orderByClause = { title: { sort: sortOrder, mode: 'insensitive' } };
    } else if (['publishedAt', 'createdAt', 'viewCount'].includes(sortField)) {
      orderByClause = { [sortField]: sortOrder };
    } else {
      orderByClause = { publishedAt: 'desc' };
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      select: {
        id: true, title: true, slug: true, excerpt: true, thumbnailUrl: true,
        author: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        category: { select: { id: true, name: true, slug: true } },
        // Correct way to select the related Tag models directly
        new_tags_relation: { // <-- Use the correct relation field name from your Article model
          select: {         // Select fields from the Tag model
            id: true,
            name: true,
            slug: true,
          },
        },
        publishedAt: true, readTime: true, viewCount: true, createdAt: true,
        // Do NOT include old_tags_data here unless specifically needed for a different purpose
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalArticles = await prisma.article.count({ where: whereClause });
    const totalPages = Math.ceil(totalArticles / limit);

    // The 'articles' variable will now have 'new_tags_relation' which is an array of Tag objects (or null/undefined if not present)
    // We can rename it to 'tags' in the formatted output for consistency if desired by the frontend.
    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      thumbnailUrl: article.thumbnailUrl || null,
      category: article.category,
      tags: article.new_tags_relation || [], // <-- Use new_tags_relation and provide a default empty array
      publishedAt: article.publishedAt,
      readTime: article.readTime,
      viewCount: article.viewCount,
      createdAt: article.createdAt,
      author: article.author ? {
        id: article.author.id,
        name: article.author.name || 'Unknown Author',
        profile: { avatarUrl: article.author.profile?.avatarUrl || null },
      } : { id: null, name: 'Unknown Author', profile: { avatarUrl: null } },
    }));

    if (formattedArticles.length === 0 && page === 1) {
        return res.status(200).json(
         new ApiResponse(200, { articles: [], currentPage: page, totalPages, totalArticles }, 'No published articles found matching your criteria.')
       );
    }

    return res.status(200).json(
      new ApiResponse(200, { articles: formattedArticles, currentPage: page, totalPages, totalArticles }, 'Published articles fetched successfully.')
    );
  } catch (error) {
    console.error('------------------------------------------------------');
    console.error('Error in getAllPublishedArticles Controller:');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Route:', req.method, req.originalUrl);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) { console.error('Prisma Error Code:', error.code); }
    if (error.meta) { console.error('Prisma Error Meta:', JSON.stringify(error.meta, null, 2)); }
    console.error('Error Stack:', error.stack);
    console.error('Request Query:', JSON.stringify(req.query, null, 2));
    console.error('------------------------------------------------------');
    next(new ApiError(500, 'Failed to fetch articles. Please check server logs for details.', [error.message]));
  }
};

export const getArticleBySlug = async (req, res, next) => {
  try {
    const { articleSlug } = req.params;
    if (!articleSlug || String(articleSlug).trim() === '') {
      return next(new ApiError(400, 'Article slug is required.'));
    }

    const article = await prisma.article.findUnique({
      where: { slug: articleSlug, status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, content: true, excerpt: true, thumbnailUrl: true,
        author: { select: { id: true, name: true, profile: { select: { avatarUrl: true, headline: true, socialLinks: true } } } },
        category: { select: { id: true, name: true, slug: true } },
        new_tags_relation: { // <-- Use the correct relation field name
          select: {
            id: true, name: true, slug: true
          }
        },
        publishedAt: true, readTime: true, viewCount: true, updatedAt: true, createdAt: true,
      },
    });

    if (!article) {
      return next(new ApiError(404, `Article with slug '${articleSlug}' not found or is not published.`));
    }

    prisma.article.update({
      where: { id: article.id }, data: { viewCount: { increment: 1 } },
    }).catch(viewCountError => {
      console.error(`Failed to increment view count for article ${article.id}:`, viewCountError.message);
    });

    const formattedArticle = {
      ...article,
      tags: article.new_tags_relation || [], // <-- Use new_tags_relation and provide a default empty array
      author: article.author ? {
        id: article.author.id,
        name: article.author.name || 'Unknown Author',
        profile: {
            avatarUrl: article.author.profile?.avatarUrl || null,
            headline: article.author.profile?.headline || null,
            socialLinks: article.author.profile?.socialLinks || null,
        }
      } : { id: null, name: 'Unknown Author', profile: { avatarUrl: null, headline: null, socialLinks: null } },
      thumbnailUrl: article.thumbnailUrl || null,
    };

    return res.status(200).json(new ApiResponse(200, { article: formattedArticle }, 'Article fetched successfully.'));
  } catch (error) {
    console.error('------------------------------------------------------');
    console.error(`Error in getArticleBySlug Controller for slug '${req.params.articleSlug}':`);
    console.error('Timestamp:', new Date().toISOString());
    console.error('Route:', req.method, req.originalUrl);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) { console.error('Prisma Error Code:', error.code); }
    if (error.meta) { console.error('Prisma Error Meta:', JSON.stringify(error.meta, null, 2)); }
    console.error('Error Stack:', error.stack);
    console.error('------------------------------------------------------');
    if (error.code === 'P2025') {
        return next(new ApiError(404, `Article with slug '${req.params.articleSlug}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch article. Please check server logs for details.', [error.message]));
  }
};