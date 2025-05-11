// server/src/controllers/enrollmentController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Enroll the current user in a course
 * @route   POST /api/enrollments
 * @access  Private (Authenticated Users)
 * @body    { courseId: number }
 * @notes   This endpoint is typically called after a successful payment verification
 * or if the course is free. The payment verification logic itself
 * would be in paymentController.js, which then might call this service/controller.
 * For free courses, this could be called directly.
 */
export const createEnrollment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { courseId } = req.body;
  const userId = req.user.userId; // From authMiddleware

  if (!courseId) {
    return next(new ApiError(400, 'Course ID is required for enrollment.'));
  }
  const numericCourseId = parseInt(courseId, 10);
  if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }

  try {
    // 1. Check if the course exists and is published (or if admin is enrolling for a draft course)
    const course = await prisma.course.findUnique({
      where: { id: numericCourseId },
    });

    if (!course) {
      return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }
    // Optional: Add check for course.status === 'PUBLISHED' if students can only enroll in published courses
    // if (course.status !== 'PUBLISHED' && req.user.role !== 'ADMIN') {
    //   return next(new ApiError(403, 'This course is not currently available for enrollment.'));
    // }


    // 2. Check if the user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { // Using the compound unique key defined in Prisma schema
          userId: userId,
          courseId: numericCourseId,
        },
      },
    });

    if (existingEnrollment) {
      // Depending on policy, you might return the existing enrollment or an error
      return res.status(200).json(
        new ApiResponse(200, { enrollment: existingEnrollment }, 'User is already enrolled in this course.')
      );
      // OR: return next(new ApiError(409, 'You are already enrolled in this course.'));
    }

    // 3. Create the enrollment record
    const newEnrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: numericCourseId,
        enrolledAt: new Date(),
      },
      include: { // Include related data in the response for context
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    // TODO:
    // - Potentially create initial UserProgress records for all lessons in the course.
    // - Send a confirmation email to the user.
    // - Notify the instructor (if applicable).

    return res
      .status(201)
      .json(new ApiResponse(201, { enrollment: newEnrollment }, 'Successfully enrolled in the course.'));

  } catch (error) {
    console.error('Error creating enrollment:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation (should be caught by existingEnrollment check)
        return next(new ApiError(409, 'Enrollment record conflict. You might already be enrolled.'));
    }
    if (error.code === 'P2003') { // Foreign key constraint failed (e.g. courseId or userId doesn't exist)
        return next(new ApiError(404, 'Invalid course or user ID provided for enrollment.'));
    }
    next(new ApiError(500, 'Failed to enroll in the course.', [error.message]));
  }
};

/**
 * @desc    Get all courses the current user is enrolled in
 * @route   GET /api/enrollments/my-courses
 * @access  Private (Authenticated Users)
 */
export const getMyEnrolledCourses = async (req, res, next) => {
  const userId = req.user.userId; // From authMiddleware

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
      },
      include: {
        course: { // Include details of the enrolled course
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            description: true, // For excerpt
            instructor: { // Include instructor's name
              select: {
                id: true,
                name: true,
                profile: {select: {avatarUrl: true}}
              },
            },
            // Optional: Add progress calculation here or fetch UserProgress separately
            // For simplicity, we'll just return the course details for now.
            // Frontend can then fetch UserProgress for each course if needed.
            modules: { // To get the first lesson ID for "Continue Learning" link
              orderBy: { order: 'asc' },
              select: {
                lessons: {
                  orderBy: { order: 'asc' },
                  select: { id: true },
                  take: 1
                }
              },
              take: 1
            }
          },
        },
      },
      orderBy: {
        enrolledAt: 'desc', // Show most recent enrollments first
      },
    });

    // Transform the data to be more frontend-friendly
    const enrolledCourses = enrollments.map(enrollment => {
      const courseData = enrollment.course;
      if (!courseData) return null; // Should not happen if data integrity is maintained

      const firstLessonId = courseData.modules?.[0]?.lessons?.[0]?.id || null;

      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt, // If you track overall course completion
        course: {
          id: courseData.id,
          title: courseData.title,
          slug: courseData.slug,
          thumbnailUrl: courseData.thumbnailUrl,
          descriptionExcerpt: courseData.description?.substring(0, 120) + (courseData.description?.length > 120 ? '...' : ''),
          instructorName: courseData.instructor?.name || 'N/A',
          instructorAvatarUrl: courseData.instructor?.profile?.avatarUrl || null,
          firstLessonId: firstLessonId,
        },
      };
    }).filter(Boolean); // Remove any null entries if a course was somehow missing

    return res
      .status(200)
      .json(new ApiResponse(200, { enrolledCourses }, 'Fetched enrolled courses successfully.'));

  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    next(new ApiError(500, 'Failed to fetch enrolled courses.', [error.message]));
  }
};

// Future: Get specific enrollment details, update progress (might be better in a progressController)
