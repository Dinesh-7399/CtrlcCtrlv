// server/src/controllers/reviewController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator'; // Only if you were to use it directly here, typically handled by middleware

// Import enums if needed directly in this controller, though for getCourseReviews it's not strictly necessary
// import { ContentStatus } from '@prisma/client';

const REVIEWS_PER_PAGE = 10; // Default from your file

/**
 * @desc    Get all reviews for a specific course with pagination
 * @route   GET /api/courses/:courseId/reviews
 * @access  Public
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    // courseId is already an integer due to .toInt() in router's validation
    const courseId = req.params.courseId;
    // page and limit are also integers or defaults due to router's validation
    const page = req.query.page || 1;
    const limit = req.query.limit || REVIEWS_PER_PAGE;
    const skip = (page - 1) * limit;

    // 1. Check if the course exists and is published
    //    Ensuring ContentStatus.PUBLISHED matches your enum definition.
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        status: 'PUBLISHED', // Directly use the string value if ContentStatus enum is correctly set up
      },
    });

    if (!course) {
      return next(new ApiError(404, `Published course with ID '${courseId}' not found.`));
    }

    // 2. Fetch reviews for the course
    const reviews = await prisma.review.findMany({
      where: {
        courseId: courseId,
      },
      include: {
        user: { // This will fetch the related user
          select: { // Specify which fields of the user and their profile to fetch
            id: true,
            name: true,
            profile: { // Nested select for the related profile
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: skip,
      take: limit,
    });

    const totalReviews = await prisma.review.count({
      where: { courseId: courseId },
    });
    const totalPages = Math.ceil(totalReviews / limit);

    // 3. Format reviews robustly
    const formattedReviews = reviews.map(review => {
      // Schema `Review.userId` is NOT NULL & FK with CASCADE. `User.profile` is 1-to-1 & created on user registration.
      // So, review.user and review.user.profile should theoretically always exist.
      // Optional chaining `?.` is used for an extra layer of safety.
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        courseId: review.courseId,
        userId: review.userId,
        user: {
          id: review.user?.id,
          name: review.user?.name || 'Anonymous User', // Fallback name
          profile: { // Ensure profile object always exists in response
            avatarUrl: review.user?.profile?.avatarUrl || null,
          },
        },
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews: formattedReviews,
          currentPage: page,
          totalPages,
          totalReviews,
          courseId: courseId, // Pass back the courseId for context
        },
        'Course reviews fetched successfully.'
      )
    );
  } catch (error) {
    // This console.error is CRUCIAL for debugging 500 errors on your server.
    console.error(`Error in getCourseReviews for course ID '${req.params.courseId}':`, error.name, error.message, error.stack);
    next(new ApiError(500, 'Failed to fetch course reviews.', [error.message]));
  }
};

/**
 * @desc    Create or Update a review for a course by the current user
 * @route   POST /api/courses/:courseId/reviews
 * @access  Private (Authenticated and Enrolled Users)
 */
export const upsertCourseReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const courseId = req.params.courseId; // Already an integer from route validation
  const userId = req.user.userId;
  const { rating, comment } = req.body;

  // Basic validation already done by express-validator, but can re-check if needed
  // if (typeof rating !== 'number' || rating < 1 || rating > 5) ...

  try {
    const courseExists = await prisma.course.findUnique({
        where: { id: courseId, status: 'PUBLISHED' }
    });
    if (!courseExists) {
        return next(new ApiError(404, `Published course with ID ${courseId} not found for review.`));
    }

    // enrollmentCheckMiddleware should have been called in the route for this

    const review = await prisma.review.upsert({
      where: { userId_courseId: { userId: userId, courseId: courseId } },
      update: { rating: rating, comment: comment || null },
      create: { userId: userId, courseId: courseId, rating: rating, comment: comment || null },
      include: {
        user: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
      },
    });

    const formattedReview = {
        ...review,
        user: {
            id: review.user?.id,
            name: review.user?.name || 'Anonymous User',
            profile: {
                avatarUrl: review.user?.profile?.avatarUrl || null,
            }
        }
    };

    const wasCreated = Math.abs(review.createdAt.getTime() - review.updatedAt.getTime()) < 1000;

    // TODO: Recalculate course average rating (could be a post-save trigger or async job)

    return res
      .status(wasCreated ? 201 : 200)
      .json(
        new ApiResponse(
          wasCreated ? 201 : 200,
          { review: formattedReview },
          wasCreated ? 'Review submitted successfully.' : 'Review updated successfully.'
        )
      );
  } catch (error) {
    console.error(`Error upserting review for course ID '${courseId}':`, error);
    if (error.code === 'P2003') {
        return next(new ApiError(404, 'Invalid course or user ID for review.'));
    }
    next(new ApiError(500, 'Failed to save review.', [error.message]));
  }
};

/**
 * @desc    Delete a review (by the user who wrote it or an admin)
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Review author or Admin)
 */
export const deleteReview = async (req, res, next) => {
    try {
        const reviewId = req.params.reviewId; // Already an integer from route validation
        const userId = req.user.userId;
        const userRole = req.user.role;

        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            select: { userId: true, courseId: true }
        });

        if (!review) {
            return next(new ApiError(404, 'Review not found.'));
        }

        if (review.userId !== userId && userRole !== 'ADMIN') {
            return next(new ApiError(403, 'You are not authorized to delete this review.'));
        }

        await prisma.review.delete({
            where: { id: reviewId },
        });

        // TODO: Recalculate course average rating for review.courseId

        return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully.'));
    } catch (error) {
        console.error(`Error deleting review ID '${req.params.reviewId}':`, error);
        if (error.code === 'P2025') { // Record to delete not found
            return next(new ApiError(404, 'Review not found to delete.'));
        }
        next(new ApiError(500, 'Failed to delete review.', [error.message]));
    }
};