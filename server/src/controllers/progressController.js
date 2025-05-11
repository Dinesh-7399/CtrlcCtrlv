// server/src/controllers/progressController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Mark a lesson as completed (or update its progress) for the current user.
 * @route   POST /api/progress/lesson/:lessonId/complete  (or PUT)
 * @access  Private (Authenticated and Enrolled Users)
 * @body    { completed?: boolean } (optional, defaults to true if not provided)
 * @notes   This endpoint assumes enrollmentCheckMiddleware has verified access to the course
 * containing this lesson.
 */
export const markLessonProgress = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { lessonId } = req.params;
  const numericLessonId = parseInt(lessonId, 10);
  const userId = req.user.userId; // From authMiddleware

  // 'completed' status from body, defaults to true if not provided
  const completedStatus = typeof req.body.completed === 'boolean' ? req.body.completed : true;

  if (isNaN(numericLessonId)) {
    return next(new ApiError(400, 'Invalid Lesson ID format.'));
  }

  try {
    // 1. Verify the lesson exists (optional, but good for data integrity)
    const lesson = await prisma.lesson.findUnique({
      where: { id: numericLessonId },
      select: { id: true, moduleId: true, module: { select: { courseId: true } } }, // Include courseId for context
    });

    if (!lesson) {
      return next(new ApiError(404, `Lesson with ID ${numericLessonId} not found.`));
    }

    // NOTE: enrollmentCheckMiddleware should handle verifying if the user is enrolled
    // in lesson.module.courseId. If not using that middleware directly on this route,
    // you'd need to add that check here.

    // 2. Upsert (Create or Update) the UserProgress record
    const userProgress = await prisma.userProgress.upsert({
      where: {
        userId_lessonId: { // Using the compound unique key
          userId: userId,
          lessonId: numericLessonId,
        },
      },
      update: {
        completed: completedStatus,
        completedAt: completedStatus ? new Date() : null, // Set completedAt only if marking as complete
      },
      create: {
        userId: userId,
        lessonId: numericLessonId,
        completed: completedStatus,
        completedAt: completedStatus ? new Date() : null,
      },
      select: { // Select fields to return
        id: true,
        userId: true,
        lessonId: true,
        completed: true,
        completedAt: true,
        lesson: { select: { title: true } }
      }
    });

    // TODO:
    // - Potentially recalculate overall course progress if a lesson is completed.
    // - Emit an event if real-time progress updates are needed on a dashboard.

    const message = completedStatus ? 'Lesson marked as completed.' : 'Lesson progress updated.';
    return res
      .status(200) // 200 for update, could be 201 if strictly creating
      .json(new ApiResponse(200, { userProgress }, message));

  } catch (error) {
    console.error(`Error updating progress for lesson ID '${lessonId}':`, error);
     if (error.code === 'P2003') { // Foreign key constraint failed
        return next(new ApiError(404, 'Invalid lesson or user ID for progress update.'));
    }
    next(new ApiError(500, 'Failed to update lesson progress.', [error.message]));
  }
};

/**
 * @desc    Get user's progress for all lessons in a specific course
 * @route   GET /api/progress/course/:courseId
 * @access  Private (Authenticated and Enrolled Users)
 */
export const getCourseProgressForUser = async (req, res, next) => {
  const { courseId } = req.params;
  const numericCourseId = parseInt(courseId, 10);
  const userId = req.user.userId;

  if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }

  try {
    // 1. Verify course exists and user is enrolled (enrollmentCheckMiddleware should handle this)
    const course = await prisma.course.findUnique({
        where: { id: numericCourseId },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: {
                        orderBy: { order: 'asc' },
                        select: { id: true, title: true } // Select only needed lesson fields
                    }
                }
            }
        }
    });

    if (!course) {
        return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }

    // 2. Fetch all UserProgress records for this user and the lessons in this course
    const lessonIdsInCourse = course.modules.flatMap(module => module.lessons.map(lesson => lesson.id));

    if (lessonIdsInCourse.length === 0) {
        return res.status(200).json(new ApiResponse(200, {
            courseId: numericCourseId,
            courseTitle: course.title,
            progressPercentage: 0,
            completedLessons: 0,
            totalLessons: 0,
            lessonProgress: []
        }, 'No lessons in this course to track progress.'));
    }

    const userProgressRecords = await prisma.userProgress.findMany({
      where: {
        userId: userId,
        lessonId: {
          in: lessonIdsInCourse,
        },
      },
      select: {
        lessonId: true,
        completed: true,
        completedAt: true,
      },
    });

    // 3. Map progress to lessons and calculate overall progress
    let completedLessonsCount = 0;
    const lessonProgressMap = {};
    userProgressRecords.forEach(record => {
      lessonProgressMap[record.lessonId] = record;
      if (record.completed) {
        completedLessonsCount++;
      }
    });

    const detailedLessonProgress = course.modules.flatMap(module =>
        module.lessons.map(lesson => ({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            moduleId: module.id,
            moduleTitle: module.title,
            completed: !!lessonProgressMap[lesson.id]?.completed,
            completedAt: lessonProgressMap[lesson.id]?.completedAt || null,
        }))
    );

    const totalLessonsInCourse = lessonIdsInCourse.length;
    const progressPercentage = totalLessonsInCourse > 0
      ? parseFloat(((completedLessonsCount / totalLessonsInCourse) * 100).toFixed(1))
      : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          courseId: numericCourseId,
          courseTitle: course.title,
          progressPercentage,
          completedLessons: completedLessonsCount,
          totalLessons: totalLessonsInCourse,
          lessonProgress: detailedLessonProgress, // Array of progress status for each lesson
        },
        'Course progress fetched successfully.'
      )
    );
  } catch (error) {
    console.error(`Error fetching progress for course ID '${courseId}':`, error);
    next(new ApiError(500, 'Failed to fetch course progress.', [error.message]));
  }
};
