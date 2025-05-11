// server/src/controllers/reviewController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

const REVIEWS_PER_PAGE = 10;

/**
 * @desc    Create or Update a review for a course by the current user
 * @route   POST /api/courses/:courseId/reviews
 * @access  Private (Authenticated and Enrolled Users)
 * @body    { rating: number, comment?: string }
 * @notes   Uses upsert to allow a user to create a new review or update their existing one.
 * Assumes enrollmentCheckMiddleware has verified the user is enrolled in :courseId.
 */
export const upsertCourseReview = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { courseId } = req.params;
  const numericCourseId = parseInt(courseId, 10);
  const userId = req.user.userId; // From authMiddleware
  const { rating, comment } = req.body;

  if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }

  // Rating is typically 1-5
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return next(new ApiError(400, 'Rating must be a number between 1 and 5.'));
  }
  if (comment && typeof comment !== 'string') {
    return next(new ApiError(400, 'Comment must be a string.'));
  }

  try {
    // enrollmentCheckMiddleware should have already verified enrollment.
    // As an additional check, ensure the course exists.
    const courseExists = await prisma.course.findUnique({
        where: { id: numericCourseId, status: 'PUBLISHED' } // Users can only review published courses
    });
    if (!courseExists) {
        return next(new ApiError(404, `Published course with ID ${numericCourseId} not found.`));
    }

    const review = await prisma.review.upsert({
      where: {
        userId_courseId: { // Using the compound unique key
          userId: userId,
          courseId: numericCourseId,
        },
      },
      update: {
        rating: rating,
        comment: comment || null, // Allow empty string or null for comment
      },
      create: {
        userId: userId,
        courseId: numericCourseId,
        rating: rating,
        comment: comment || null,
      },
      include: { // Include user details in the response
        user: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
      },
    });
    
    const formattedReview = {
        ...review,
        user: {
            id: review.user.id,
            name: review.user.name,
            avatarUrl: review.user.profile?.avatarUrl || null,
        }
    };

    // Determine if it was a create (201) or update (200)
    // Prisma's upsert doesn't directly tell us if it created or updated in the return value easily
    // We can check timestamps, or assume 200 for simplicity if the frontend doesn't strictly need to know.
    // For this example, we'll check if createdAt and updatedAt are very close.
    const wasCreated = Math.abs(review.createdAt.getTime() - review.updatedAt.getTime()) < 1000; // within 1 second

    // TODO: After a review is submitted/updated, recalculate the course's average rating.
    // This could be done here, or via a database trigger, or a background job.

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
    if (error.code === 'P2003') { // Foreign key constraint (e.g. courseId or userId invalid)
        return next(new ApiError(404, 'Invalid course or user ID for review.'));
    }
    next(new ApiError(500, 'Failed to save review.', [error.message]));
  }
};

/**
 * @desc    Get all reviews for a specific course with pagination
 * @route   GET /api/courses/:courseId/reviews
 * @access  Public
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const numericCourseId = parseInt(courseId, 10);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || REVIEWS_PER_PAGE;
    const skip = (page - 1) * limit;

    // Optional: Add sorting (e.g., newest, highest_rating, lowest_rating)
    // const { sortBy = 'newest' } = req.query;
    // let orderByClause = { createdAt: 'desc' };
    // if (sortBy === 'highest_rating') orderByClause = { rating: 'desc' };
    // else if (sortBy === 'lowest_rating') orderByClause = { rating: 'asc' };

    if (isNaN(numericCourseId)) {
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    const reviews = await prisma.review.findMany({
      where: {
        courseId: numericCourseId,
        // Optional: Filter for reviews that have a comment, or are approved by admin if moderation is added
        // comment: { not: null }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Default to newest reviews first
        // orderBy: orderByClause,
      },
      skip: skip,
      take: limit,
    });

    const totalReviews = await prisma.review.count({
      where: { courseId: numericCourseId /*, comment: { not: null } */ },
    });
    const totalPages = Math.ceil(totalReviews / limit);

    const formattedReviews = reviews.map(review => ({
        ...review,
        user: {
            id: review.user.id,
            name: review.user.name,
            avatarUrl: review.user.profile?.avatarUrl || null,
        }
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews: formattedReviews,
          currentPage: page,
          totalPages,
          totalReviews,
        },
        'Course reviews fetched successfully.'
      )
    );
  } catch (error) {
    console.error(`Error fetching reviews for course ID '${req.params.courseId}':`, error);
    next(new ApiError(500, 'Failed to fetch course reviews.', [error.message]));
  }
};

/**
 * @desc    Delete a review (by the user who wrote it or an admin)
 * @route   DELETE /api/reviews/:reviewId
 * @access  Private (Review author or Admin)
 */
export const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const numericReviewId = parseInt(reviewId, 10);
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (isNaN(numericReviewId)) {
            return next(new ApiError(400, 'Invalid Review ID format.'));
        }

        const review = await prisma.review.findUnique({
            where: { id: numericReviewId },
            select: { userId: true, courseId: true } // Need courseId for recalculating average rating
        });

        if (!review) {
            return next(new ApiError(404, 'Review not found.'));
        }

        // Authorization: User can delete their own review, or an admin can delete any review
        if (review.userId !== userId && userRole !== 'ADMIN') {
            return next(new ApiError(403, 'You are not authorized to delete this review.'));
        }

        await prisma.review.delete({
            where: { id: numericReviewId },
        });

        // TODO: After a review is deleted, recalculate the course's average rating.
        // This would involve fetching all remaining reviews for review.courseId and averaging.

        return res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully.'));
        // Or return 204 No Content: return res.status(204).send();

    } catch (error) {
        console.error(`Error deleting review ID '${req.params.reviewId}':`, error);
        if (error.code === 'P2025') { // Record to delete not found
            return next(new ApiError(404, 'Review not found.'));
        }
        next(new ApiError(500, 'Failed to delete review.', [error.message]));
    }
};
