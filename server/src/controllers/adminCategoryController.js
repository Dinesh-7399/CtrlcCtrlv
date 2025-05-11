// server/src/controllers/adminCategoryController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';
import slugify from 'slugify';

const CATEGORIES_PER_PAGE_ADMIN = 20;

/**
 * @desc    Create a new category
 * @route   POST /api/admin/categories
 * @access  Private (Admin)
 * @body    { name: string, description?: string, icon?: string, slug?: string (optional, auto-generated if not provided) }
 */
export const createCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { name, description, icon, slug: providedSlug } = req.body;

  if (!name) {
    return next(new ApiError(400, 'Category name is required.'));
  }

  try {
    let slug = providedSlug
      ? slugify(providedSlug, { lower: true, strict: true, trim: true })
      : slugify(name, { lower: true, strict: true, trim: true });

    // Ensure slug uniqueness
    let existingCategoryWithSlug = await prisma.category.findUnique({ where: { slug } });
    let counter = 1;
    const baseSlug = slug; // Keep original generated/provided slug for appending counter
    while (existingCategoryWithSlug) {
      slug = `${baseSlug}-${counter}`;
      existingCategoryWithSlug = await prisma.category.findUnique({ where: { slug } });
      counter++;
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { category: newCategory }, 'Category created successfully.'));

  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return next(new ApiError(409, `A category with the name '${name}' already exists.`));
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return next(new ApiError(409, `The generated or provided slug is already in use. Please try a different name or slug.`));
    }
    next(new ApiError(500, 'Failed to create category.', [error.message]));
  }
};

/**
 * @desc    Get all categories (for admin view)
 * @route   GET /api/admin/categories
 * @access  Private (Admin)
 */
export const getAllCategoriesForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || CATEGORIES_PER_PAGE_ADMIN;
    const skip = (page - 1) * limit;
    const { searchTerm, sortBy = 'name_asc' } = req.query;

    let whereClause = {};
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    let orderByClause = {};
    switch (sortBy) {
      case 'name_desc': orderByClause = { name: 'desc' }; break;
      case 'courses_asc': orderByClause = { courses: { _count: 'asc' } }; break; // Sort by number of courses
      case 'courses_desc': orderByClause = { courses: { _count: 'desc' } }; break;
      case 'newest': orderByClause = { createdAt: 'desc' }; break;
      case 'oldest': orderByClause = { createdAt: 'asc' }; break;
      case 'name_asc':
      default: orderByClause = { name: 'asc' }; break;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true, // For admin list view, maybe a truncated version
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { courses: true, articles: true }, // Count associated courses and articles
        },
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalCategories = await prisma.category.count({ where: whereClause });
    const totalPages = Math.ceil(totalCategories / limit);

    const formattedCategories = categories.map(cat => ({
        ...cat,
        description: cat.description ? cat.description.substring(0, 100) + (cat.description.length > 100 ? '...' : '') : null,
        courseCount: cat._count?.courses || 0,
        articleCount: cat._count?.articles || 0,
        _count: undefined, // Clean up
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { categories: formattedCategories, currentPage: page, totalPages, totalCategories },
        'Admin: Categories fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching categories for admin:', error);
    next(new ApiError(500, 'Failed to fetch categories for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single category by ID (for admin editing)
 * @route   GET /api/admin/categories/:categoryId
 * @access  Private (Admin)
 */
export const getCategoryByIdForAdmin = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const numericCategoryId = parseInt(categoryId, 10);

    if (isNaN(numericCategoryId)) {
      return next(new ApiError(400, 'Invalid Category ID format.'));
    }

    const category = await prisma.category.findUnique({
      where: { id: numericCategoryId },
      // Include all fields needed for the edit form
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        createdAt: true,
        updatedAt: true,
         _count: { select: { courses: true, articles: true } },
      },
    });

    if (!category) {
      return next(new ApiError(404, `Category with ID ${numericCategoryId} not found.`));
    }
    
    const responseCategory = {
        ...category,
        courseCount: category._count?.courses || 0,
        articleCount: category._count?.articles || 0,
    };
    delete responseCategory._count;


    return res
      .status(200)
      .json(new ApiResponse(200, { category: responseCategory }, 'Category details fetched for admin.'));
  } catch (error) {
    console.error(`Error fetching category ID '${req.params.categoryId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch category details for admin.', [error.message]));
  }
};

/**
 * @desc    Update an existing category
 * @route   PUT /api/admin/categories/:categoryId
 * @access  Private (Admin)
 */
export const updateCategory = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { categoryId } = req.params;
  const numericCategoryId = parseInt(categoryId, 10);
  const { name, description, icon, slug: newSlug } = req.body;

  if (isNaN(numericCategoryId)) {
    return next(new ApiError(400, 'Invalid Category ID format.'));
  }

  try {
    const existingCategory = await prisma.category.findUnique({ where: { id: numericCategoryId } });
    if (!existingCategory) {
      return next(new ApiError(404, `Category with ID ${numericCategoryId} not found.`));
    }

    const dataToUpdate = {};
    if (name !== undefined && name !== existingCategory.name) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description; // Allow setting to null or empty
    if (icon !== undefined) dataToUpdate.icon = icon; // Allow setting to null or empty

    // Handle slug update: if name changes and no manual slug, regenerate. If manual slug, use it (check uniqueness).
    if (name && name !== existingCategory.name && !newSlug) {
      let generatedSlug = slugify(name, { lower: true, strict: true, trim: true });
      let conflictCheck = await prisma.category.findFirst({ where: { slug: generatedSlug, NOT: { id: numericCategoryId } } });
      let counter = 1;
      const baseSlug = generatedSlug;
      while (conflictCheck) {
        generatedSlug = `${baseSlug}-${counter}`;
        conflictCheck = await prisma.category.findFirst({ where: { slug: generatedSlug, NOT: { id: numericCategoryId } } });
        counter++;
      }
      dataToUpdate.slug = generatedSlug;
    } else if (newSlug && newSlug !== existingCategory.slug) {
      const formattedNewSlug = slugify(newSlug, { lower: true, strict: true, trim: true });
      const conflictCheck = await prisma.category.findFirst({ where: { slug: formattedNewSlug, NOT: { id: numericCategoryId } } });
      if (conflictCheck) {
        return next(new ApiError(409, `Slug '${formattedNewSlug}' is already in use.`));
      }
      dataToUpdate.slug = formattedNewSlug;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(200).json(new ApiResponse(200, { category: existingCategory }, 'No changes provided to update category.'));
    }

    const updatedCategory = await prisma.category.update({
      where: { id: numericCategoryId },
      data: dataToUpdate,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { category: updatedCategory }, 'Category updated successfully.'));

  } catch (error) {
    console.error(`Error updating category ID '${categoryId}':`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return next(new ApiError(409, `A category with the name '${name}' already exists.`));
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return next(new ApiError(409, `The slug '${dataToUpdate.slug || newSlug}' is already in use.`));
    }
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Category with ID ${categoryId} not found.`));
    }
    next(new ApiError(500, 'Failed to update category.', [error.message]));
  }
};

/**
 * @desc    Delete a category
 * @route   DELETE /api/admin/categories/:categoryId
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const numericCategoryId = parseInt(categoryId, 10);

    if (isNaN(numericCategoryId)) {
      return next(new ApiError(400, 'Invalid Category ID format.'));
    }

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
        where: { id: numericCategoryId },
        include: { _count: { select: { courses: true, articles: true } } } // Check for associated items
    });

    if (!categoryExists) {
        return next(new ApiError(404, `Category with ID ${numericCategoryId} not found.`));
    }

    // Optional: Prevent deletion if category has associated courses/articles,
    // or handle unlinking/re-assigning them.
    // Your schema uses onDelete: SetNull for courses and articles linked to category,
    // so deleting a category will set categoryId to null on those items.
    // If you want to prevent deletion if items are linked, add a check here:
    if ((categoryExists._count?.courses || 0) > 0 || (categoryExists._count?.articles || 0) > 0) {
        // return next(new ApiError(400, `Cannot delete category '${categoryExists.name}' as it has associated courses or articles. Please reassign or delete them first.`));
        console.warn(`Deleting category '${categoryExists.name}' which has ${categoryExists._count.courses} courses and ${categoryExists._count.articles} articles. Their categoryId will be set to null.`);
    }


    await prisma.category.delete({
      where: { id: numericCategoryId },
    });

    return res
      .status(200) // Or 204 No Content
      .json(new ApiResponse(200, null, 'Category deleted successfully.'));
  } catch (error) {
    console.error(`Error deleting category ID '${req.params.categoryId}':`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return next(new ApiError(404, `Category with ID '${req.params.categoryId}' not found.`));
    }
    // P2003 is foreign key constraint violation, but with onDelete: SetNull, this shouldn't block deletion.
    next(new ApiError(500, 'Failed to delete category.', [error.message]));
  }
};
