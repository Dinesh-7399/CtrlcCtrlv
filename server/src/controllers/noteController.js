// server/src/controllers/noteController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get the note for a specific lesson for the current user
 * @route   GET /api/notes/lesson/:lessonId
 * @access  Private (Authenticated Users - enrollment might be checked by a preceding middleware or route structure)
 */
export const getNoteForLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const numericLessonId = parseInt(lessonId, 10);
    const userId = req.user.userId; // From authMiddleware

    if (isNaN(numericLessonId)) {
      return next(new ApiError(400, 'Invalid Lesson ID format.'));
    }

    // Optional: Verify lesson exists and user is enrolled in the course containing this lesson.
    // This might be redundant if enrollmentCheckMiddleware is used on the route.
    // For this controller, we'll assume access to the lesson implies ability to take notes.

    const note = await prisma.note.findUnique({
      where: {
        userId_lessonId: { // Using the compound unique key
          userId: userId,
          lessonId: numericLessonId,
        },
      },
      select: {
        id: true,
        content: true,
        lessonId: true,
        userId: true,
        updatedAt: true,
      },
    });

    if (!note) {
      // It's not an error if a note doesn't exist yet, just return null or an empty object.
      return res
        .status(200)
        .json(new ApiResponse(200, { note: null }, 'No note found for this lesson. Create one by saving.'));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { note }, 'Note fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching note for lesson ID '${req.params.lessonId}':`, error);
    next(new ApiError(500, 'Failed to fetch note.', [error.message]));
  }
};

/**
 * @desc    Create or Update a note for a specific lesson for the current user
 * @route   POST /api/notes/lesson/:lessonId  (Can also be PUT)
 * @access  Private (Authenticated Users)
 * @body    { content: string }
 */
export const upsertNoteForLesson = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { lessonId } = req.params;
  const numericLessonId = parseInt(lessonId, 10);
  const userId = req.user.userId; // From authMiddleware
  const { content } = req.body;

  if (isNaN(numericLessonId)) {
    return next(new ApiError(400, 'Invalid Lesson ID format.'));
  }

  if (typeof content !== 'string') { // Basic check for content
    return next(new ApiError(400, 'Note content must be a string.'));
  }

  try {
    // Optional: Verify lesson exists and user is enrolled.
    // This adds overhead but ensures data integrity if not handled by route middleware.
    const lessonExists = await prisma.lesson.findUnique({ where: { id: numericLessonId } });
    if (!lessonExists) {
        return next(new ApiError(404, `Lesson with ID ${numericLessonId} not found.`));
    }
    // Further enrollment check could be added here if not using middleware for this specific route.

    const note = await prisma.note.upsert({
      where: {
        userId_lessonId: { // Using the compound unique key
          userId: userId,
          lessonId: numericLessonId,
        },
      },
      update: {
        content: content,
      },
      create: {
        userId: userId,
        lessonId: numericLessonId,
        content: content,
      },
      select: {
        id: true,
        content: true,
        lessonId: true,
        userId: true,
        updatedAt: true,
      }
    });

    return res
      .status(note.createdAt.getTime() === note.updatedAt.getTime() ? 201 : 200) // 201 if created, 200 if updated
      .json(new ApiResponse(
        note.createdAt.getTime() === note.updatedAt.getTime() ? 201 : 200,
        { note },
        note.createdAt.getTime() === note.updatedAt.getTime() ? 'Note created successfully.' : 'Note updated successfully.'
      ));

  } catch (error) {
    console.error(`Error upserting note for lesson ID '${lessonId}':`, error);
    if (error.code === 'P2003') { // Foreign key constraint failed (e.g., lessonId or userId doesn't exist)
        return next(new ApiError(404, 'Invalid lesson or user ID provided for note.'));
    }
    next(new ApiError(500, 'Failed to save note.', [error.message]));
  }
};

/**
 * @desc    Delete a note for a specific lesson for the current user
 * @route   DELETE /api/notes/lesson/:lessonId
 * @access  Private (Authenticated Users)
 */
export const deleteNoteForLesson = async (req, res, next) => {
    try {
        const { lessonId } = req.params;
        const numericLessonId = parseInt(lessonId, 10);
        const userId = req.user.userId;

        if (isNaN(numericLessonId)) {
            return next(new ApiError(400, 'Invalid Lesson ID format.'));
        }

        const noteToDelete = await prisma.note.findUnique({
             where: {
                userId_lessonId: { userId, lessonId: numericLessonId }
             }
        });

        if (!noteToDelete) {
            return next(new ApiError(404, 'Note not found for this lesson to delete.'));
        }

        await prisma.note.delete({
            where: {
                userId_lessonId: {
                    userId: userId,
                    lessonId: numericLessonId,
                },
            },
        });

        return res
            .status(200) // Or 204 No Content if you prefer not to send a body
            .json(new ApiResponse(200, null, 'Note deleted successfully.'));

    } catch (error) {
        console.error(`Error deleting note for lesson ID '${req.params.lessonId}':`, error);
        if (error.code === 'P2025') { // Record to delete not found (already handled by findUnique check)
            return next(new ApiError(404, 'Note not found to delete.'));
        }
        next(new ApiError(500, 'Failed to delete note.', [error.message]));
    }
};
