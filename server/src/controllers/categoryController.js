// server/src/controllers/categoryController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true, // As defined in your Prisma schema
        description: true, // Optional: if you want to display descriptions
        // _count: { // Optional: to get the number of courses in each category
        //   select: { courses: true },
        // },
      },
      orderBy: {
        name: 'asc', // Order categories alphabetically by name
      },
    });

    // // Optional: Transform the count if you included it
    // const formattedCategories = categories.map(category => ({
    //   ...category,
    //   courseCount: category._count?.courses || 0,
    // }));
    // delete category._count; // Clean up

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          // { categories: formattedCategories }, // Use if you add courseCount
          { categories },
          'Categories fetched successfully.'
        )
      );
  } catch (error) {
    console.error('Error fetching categories:', error);
    next(new ApiError(500, 'Failed to fetch categories.', [error.message]));
  }
};

/**
 * @desc    Get a single category by its slug (or ID)
 * @route   GET /api/categories/:slugOrId
 * @access  Public
 */
export const getCategoryBySlugOrId = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;

    if (!slugOrId) {
      return next(new ApiError(400, 'Category slug or ID is required.'));
    }

    // Determine if the identifier is numeric (likely an ID) or a string (slug)
    const isNumericId = /^\d+$/.test(slugOrId);
    let category;

    if (isNumericId) {
      category = await prisma.category.findUnique({
        where: { id: parseInt(slugOrId, 10) },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          description: true,
          // You might want to include courses here with pagination if this endpoint is used to list courses by category
          // courses: {
          //   where: { status: 'PUBLISHED' },
          //   take: 10, // Example pagination
          //   orderBy: { createdAt: 'desc' },
          //   select: { id: true, title: true, slug: true, thumbnailUrl: true /* ... other course fields */ }
          // }
        },
      });
    } else {
      category = await prisma.category.findUnique({
        where: { slug: slugOrId },
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          description: true,
          // courses: { ... } // Same as above if needed
        },
      });
    }

    if (!category) {
      return next(new ApiError(404, `Category '${slugOrId}' not found.`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { category }, 'Category fetched successfully.'));
  } catch (error) {
    console.error(`Error fetching category '${req.params.slugOrId}':`, error);
    if (error.code === 'P2025' || error.code === 'P2023') { // Prisma record not found or invalid ID
        return next(new ApiError(404, `Category '${req.params.slugOrId}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch category.', [error.message]));
  }
};
