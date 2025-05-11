// server/src/controllers/testimonialController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get all visible testimonials
 * @route   GET /api/testimonials
 * @access  Public
 */
export const getAllVisibleTestimonials = async (req, res, next) => {
  try {
    // Optional: Add pagination if you expect a very large number of testimonials
    // const page = parseInt(req.query.page, 10) || 1;
    // const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 testimonials
    // const skip = (page - 1) * limit;

    const testimonials = await prisma.testimonial.findMany({
      where: {
        isVisible: true, // Only fetch testimonials marked as visible
      },
      select: {
        id: true,
        quote: true,
        authorName: true,
        authorTitle: true,
        avatarUrl: true, // Include if you have this field
        // courseId: true, // Include if you want to show which course the testimonial is for
        // course: { select: { title: true } }, // If linking to course
        createdAt: true, // For potential sorting or display
      },
      orderBy: {
        // Optional: Define an order, e.g., by creation date or a specific 'order' field
        createdAt: 'desc', // Show newest testimonials first
        // order: 'asc', // If you add an 'order' field to the Testimonial model
      },
      // take: limit,
      // skip: skip,
    });

    // const totalTestimonials = await prisma.testimonial.count({
    //   where: { isVisible: true },
    // });
    // const totalPages = Math.ceil(totalTestimonials / limit);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          testimonials,
          // currentPage: page,
          // totalPages,
          // totalTestimonials,
        },
        'Visible testimonials fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    next(new ApiError(500, 'Failed to fetch testimonials.', [error.message]));
  }
};

// Other public testimonial-related functions could go here if needed,
// e.g., getTestimonialById, but typically testimonials are fetched as a list.
