// server/src/controllers/lessonController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get full details of a specific lesson for an enrolled user
 * @route   GET /api/courses/:courseId/lessons/:lessonId  (or a more direct /api/lessons/:lessonId if preferred and course context is handled)
 * @access  Private (Authenticated and Enrolled Users - via authMiddleware and enrollmentCheckMiddleware)
 */
export const getLessonDetails = async (req, res, next) => {
  try {
    const { lessonId, courseId } = req.params; // courseId is available from the route for context
    const numericLessonId = parseInt(lessonId, 10);
    const numericCourseId = parseInt(courseId, 10); // For context, though enrollment check might have used it

    if (isNaN(numericLessonId)) {
      return next(new ApiError(400, 'Invalid Lesson ID format.'));
    }
    if (isNaN(numericCourseId)) {
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    // authMiddleware and enrollmentCheckMiddleware have already run.
    // enrollmentCheckMiddleware would have verified that req.user.userId is enrolled in numericCourseId.

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: numericLessonId,
        // Optional: Ensure the lesson belongs to the specified courseId from the URL as an extra check,
        // though lessonId should be globally unique.
        // module: {
        //   courseId: numericCourseId,
        // },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true, // Full content for enrolled user
        videoUrl: true,
        videoDuration: true,
        type: true,
        order: true,
        isFreePreview: true, // Though user is enrolled, this info might still be relevant
        createdAt: true,
        updatedAt: true,
        moduleId: true,
        module: { // Include module title and courseId for context
          select: {
            id: true,
            title: true,
            courseId: true,
          }
        },
        attachments: { // Include lesson attachments
          select: {
            id: true,
            name: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        // Associated Quiz and DPP (just IDs or basic info, full details fetched by their respective controllers)
        quiz: { select: { id: true, title: true } },
        dpp: { select: { id: true, title: true } },
      },
    });

    if (!lesson) {
      return next(new ApiError(404, `Lesson with ID '${lessonId}' not found.`));
    }

    // Further check: Ensure the fetched lesson actually belongs to the courseId in the URL params
    // This is a good sanity check if lessonId might not be globally unique across all modules/courses
    // or if the enrollment check was only at the course level.
    if (lesson.module.courseId !== numericCourseId) {
        console.warn(`Mismatch: Lesson ${lessonId} (module ${lesson.moduleId}, course ${lesson.module.courseId}) accessed via course URL ${numericCourseId}`);
        return next(new ApiError(404, `Lesson not found within the specified course.`));
    }


    // TODO: Update UserProgress: Mark this lesson as 'viewed' or update 'lastAccessedAt' for the current user.
    // This logic could be in a separate progressController or service.
    // Example (simplified):
    // await prisma.userProgress.upsert({
    //   where: {
    //     userId_lessonId: { // Compound key
    //       userId: req.user.userId,
    //       lessonId: numericLessonId,
    //     },
    //   },
    //   update: { lastAccessed: new Date() }, // Or a 'views' counter
    //   create: {
    //     userId: req.user.userId,
    //     lessonId: numericLessonId,
    //     lastAccessed: new Date(),
    //     // completed: false, // Default
    //   },
    // });

    return res
      .status(200)
      .json(new ApiResponse(200, { lesson }, 'Lesson details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching lesson ID '${req.params.lessonId}':`, error);
    if (error.code === 'P2025') { // Prisma: Record to query not found
        return next(new ApiError(404, `Lesson with ID '${req.params.lessonId}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch lesson details.', [error.message]));
  }
};

// Potentially, other lesson-related actions could go here,
// but most lesson CRUD operations would be in adminLessonController.js (or adminCourseController.js).
