// server/src/controllers/adminTestimonialController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

const ADMIN_TESTIMONIALS_PER_PAGE = 10;

/**
 * @desc    Create a new testimonial
 * @route   POST /api/admin/testimonials
 * @access  Private (Admin)
 * @body    { quote: string, authorName: string, authorTitle?: string, avatarUrl?: string, isVisible?: boolean }
 */
export const createTestimonial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const {
    quote,
    authorName,
    authorTitle,
    avatarUrl,
    isVisible = true, // Default to visible when creating
  } = req.body;

  if (!quote || !authorName) {
    return next(new ApiError(400, 'Quote and Author Name are required for a testimonial.'));
  }

  try {
    const newTestimonial = await prisma.testimonial.create({
      data: {
        quote,
        authorName,
        authorTitle: authorTitle || null,
        avatarUrl: avatarUrl || null,
        isVisible: typeof isVisible === 'boolean' ? isVisible : true,
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { testimonial: newTestimonial }, 'Testimonial created successfully.'));

  } catch (error) {
    console.error('Error creating testimonial:', error);
    next(new ApiError(500, 'Failed to create testimonial.', [error.message]));
  }
};

/**
 * @desc    Get all testimonials for admin view (all statuses)
 * @route   GET /api/admin/testimonials
 * @access  Private (Admin)
 */
export const getAllTestimonialsForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ADMIN_TESTIMONIALS_PER_PAGE;
    const skip = (page - 1) * limit;

    const { searchTerm, sortBy = 'newest', visibility } = req.query;

    let whereClause = {};
    if (searchTerm) {
      whereClause.OR = [
        { quote: { contains: searchTerm, mode: 'insensitive' } },
        { authorName: { contains: searchTerm, mode: 'insensitive' } },
        { authorTitle: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (visibility === 'visible') {
        whereClause.isVisible = true;
    } else if (visibility === 'hidden') {
        whereClause.isVisible = false;
    }


    let orderByClause = {};
    switch (sortBy) {
      case 'oldest': orderByClause = { createdAt: 'asc' }; break;
      case 'author_asc': orderByClause = { authorName: 'asc' }; break;
      case 'author_desc': orderByClause = { authorName: 'desc' }; break;
      case 'newest':
      default: orderByClause = { createdAt: 'desc' }; break;
    }

    const testimonials = await prisma.testimonial.findMany({
      where: whereClause,
      select: {
        id: true,
        quote: true,
        authorName: true,
        authorTitle: true,
        avatarUrl: true,
        isVisible: true,
        createdAt: true,
        updatedAt: true,
        // courseId: true, // If you link testimonials to courses
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalTestimonials = await prisma.testimonial.count({ where: whereClause });
    const totalPages = Math.ceil(totalTestimonials / limit);

    // Truncate quote for list view if necessary
    const formattedTestimonials = testimonials.map(t => ({
        ...t,
        quoteExcerpt: t.quote.substring(0, 100) + (t.quote.length > 100 ? '...' : ''),
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { testimonials: formattedTestimonials, currentPage: page, totalPages, totalTestimonials },
        'Admin: Testimonials fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching testimonials for admin:', error);
    next(new ApiError(500, 'Failed to fetch testimonials for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single testimonial by ID (for admin editing)
 * @route   GET /api/admin/testimonials/:testimonialId
 * @access  Private (Admin)
 */
export const getTestimonialByIdForAdmin = async (req, res, next) => {
  try {
    const { testimonialId } = req.params;
    const numericId = parseInt(testimonialId, 10);

    if (isNaN(numericId)) {
      return next(new ApiError(400, 'Invalid Testimonial ID format.'));
    }

    const testimonial = await prisma.testimonial.findUnique({
      where: { id: numericId },
    });

    if (!testimonial) {
      return next(new ApiError(404, `Testimonial with ID ${numericId} not found.`));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { testimonial }, 'Testimonial details fetched for admin.'));
  } catch (error) {
    console.error(`Error fetching testimonial ID '${req.params.testimonialId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch testimonial details for admin.', [error.message]));
  }
};

/**
 * @desc    Update an existing testimonial
 * @route   PUT /api/admin/testimonials/:testimonialId
 * @access  Private (Admin)
 */
export const updateTestimonial = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { testimonialId } = req.params;
  const numericId = parseInt(testimonialId, 10);
  const { quote, authorName, authorTitle, avatarUrl, isVisible /*, courseId */ } = req.body;

  if (isNaN(numericId)) {
    return next(new ApiError(400, 'Invalid Testimonial ID format.'));
  }

  try {
    const existingTestimonial = await prisma.testimonial.findUnique({ where: { id: numericId } });
    if (!existingTestimonial) {
      return next(new ApiError(404, `Testimonial with ID ${numericId} not found.`));
    }

    const dataToUpdate = {};
    if (quote !== undefined) dataToUpdate.quote = quote;
    if (authorName !== undefined) dataToUpdate.authorName = authorName;
    if (authorTitle !== undefined) dataToUpdate.authorTitle = authorTitle; // Allow setting to null
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl; // Allow setting to null
    if (typeof isVisible === 'boolean') dataToUpdate.isVisible = isVisible;
    // if (courseId !== undefined) dataToUpdate.courseId = courseId ? parseInt(courseId, 10) : null;


    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(200).json(new ApiResponse(200, { testimonial: existingTestimonial }, 'No changes provided to update testimonial.'));
    }

    const updatedTestimonial = await prisma.testimonial.update({
      where: { id: numericId },
      data: dataToUpdate,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { testimonial: updatedTestimonial }, 'Testimonial updated successfully.'));

  } catch (error) {
    console.error(`Error updating testimonial ID '${testimonialId}':`, error);
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Testimonial with ID ${testimonialId} not found.`));
    }
    next(new ApiError(500, 'Failed to update testimonial.', [error.message]));
  }
};

/**
 * @desc    Delete a testimonial
 * @route   DELETE /api/admin/testimonials/:testimonialId
 * @access  Private (Admin)
 */
export const deleteTestimonial = async (req, res, next) => {
  try {
    const { testimonialId } = req.params;
    const numericId = parseInt(testimonialId, 10);

    if (isNaN(numericId)) {
      return next(new ApiError(400, 'Invalid Testimonial ID format.'));
    }

    const testimonialExists = await prisma.testimonial.findUnique({ where: { id: numericId }});
    if (!testimonialExists) {
        return next(new ApiError(404, `Testimonial with ID ${numericId} not found.`));
    }

    await prisma.testimonial.delete({
      where: { id: numericId },
    });

    return res
      .status(200) // Or 204 No Content
      .json(new ApiResponse(200, null, 'Testimonial deleted successfully.'));
  } catch (error) {
    console.error(`Error deleting testimonial ID '${req.params.testimonialId}':`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return next(new ApiError(404, `Testimonial with ID '${req.params.testimonialId}' not found.`));
    }
    next(new ApiError(500, 'Failed to delete testimonial.', [error.message]));
  }
};
