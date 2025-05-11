// server/src/controllers/adminDoubtController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

const ADMIN_DOUBTS_PER_PAGE = 20;

/**
 * @desc    Get all doubts for admin view (with filtering and pagination)
 * @route   GET /api/admin/doubts
 * @access  Private (Admin)
 */
export const getAllDoubtsForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ADMIN_DOUBTS_PER_PAGE;
    const skip = (page - 1) * limit;

    const {
      courseId,
      lessonId,
      userId: filterUserId, // Doubts by a specific student
      assignedInstructorId,
      status, // OPEN, RESOLVED, CLOSED
      searchTerm,
      sortBy = 'newest', // newest, oldest, lastUpdated
    } = req.query;

    let whereClause = {};
    if (courseId) whereClause.courseId = parseInt(courseId, 10);
    if (lessonId) whereClause.lessonId = parseInt(lessonId, 10);
    if (filterUserId) whereClause.userId = parseInt(filterUserId, 10);
    if (assignedInstructorId) {
      if (assignedInstructorId.toLowerCase() === 'unassigned') {
        whereClause.assignedInstructorId = null;
      } else {
        whereClause.assignedInstructorId = parseInt(assignedInstructorId, 10);
      }
    }
    if (status) whereClause.status = status.toUpperCase();

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { course: { title: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    let orderByClause = {};
    switch (sortBy) {
      case 'oldest':
        orderByClause = { createdAt: 'asc' };
        break;
      case 'lastUpdated':
        orderByClause = { updatedAt: 'desc' };
        break;
      case 'newest':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }

    const doubts = await prisma.doubt.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } }, // Student who asked
        course: { select: { id: true, title: true } },
        lesson: { select: { id: true, title: true } },
        assignedInstructor: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalDoubts = await prisma.doubt.count({ where: whereClause });
    const totalPages = Math.ceil(totalDoubts / limit);

    const formattedDoubts = doubts.map(d => ({
        ...d,
        messageCount: d._count?.messages || 0,
        _count: undefined, // clean up
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          doubts: formattedDoubts,
          currentPage: page,
          totalPages,
          totalDoubts,
        },
        'Admin: Doubts fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching doubts for admin:', error);
    next(new ApiError(500, 'Failed to fetch doubts for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single doubt by ID for admin view, including its messages
 * @route   GET /api/admin/doubts/:doubtId
 * @access  Private (Admin)
 */
export const getDoubtByIdForAdmin = async (req, res, next) => {
  try {
    const { doubtId } = req.params;
    const numericDoubtId = parseInt(doubtId, 10);

    if (isNaN(numericDoubtId)) {
      return next(new ApiError(400, 'Invalid Doubt ID format.'));
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id: numericDoubtId },
      include: {
        user: { select: { id: true, name: true, email: true, profile: {select: {avatarUrl: true}} } },
        course: { select: { id: true, title: true, slug: true } },
        lesson: { select: { id: true, title: true, slug: true } },
        assignedInstructor: { select: { id: true, name: true, email: true, profile: {select: {avatarUrl: true}} } },
        messages: {
          orderBy: { sentAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, role: true, profile: {select: {avatarUrl: true}} } }, // User who sent the message
          },
        },
      },
    });

    if (!doubt) {
      return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
    }
    
    // Format messages to include a simpler user object
    const formattedMessages = doubt.messages.map(msg => ({
        ...msg,
        user: {
            id: msg.user.id,
            name: msg.user.name,
            role: msg.user.role,
            avatarUrl: msg.user.profile?.avatarUrl || null,
        }
    }));

    const responseDoubt = {
        ...doubt,
        messages: formattedMessages,
        user: { // Format main doubt user
            id: doubt.user.id,
            name: doubt.user.name,
            email: doubt.user.email,
            avatarUrl: doubt.user.profile?.avatarUrl || null,
        },
        assignedInstructor: doubt.assignedInstructor ? {
             id: doubt.assignedInstructor.id,
            name: doubt.assignedInstructor.name,
            email: doubt.assignedInstructor.email,
            avatarUrl: doubt.assignedInstructor.profile?.avatarUrl || null,
        } : null
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { doubt: responseDoubt }, 'Admin: Doubt details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching doubt ID '${req.params.doubtId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch doubt details for admin.', [error.message]));
  }
};


/**
 * @desc    Admin: Update the status of a doubt
 * @route   PUT /api/admin/doubts/:doubtId/status
 * @access  Private (Admin)
 * @body    { status: "OPEN" | "RESOLVED" | "CLOSED" }
 */
export const updateDoubtStatusByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { doubtId } = req.params;
  const numericDoubtId = parseInt(doubtId, 10);
  const { status } = req.body;

  if (isNaN(numericDoubtId)) {
    return next(new ApiError(400, 'Invalid Doubt ID format.'));
  }
  if (!status || !['OPEN', 'RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
    return next(new ApiError(400, 'Invalid status provided. Must be OPEN, RESOLVED, or CLOSED.'));
  }

  try {
    const updatedDoubt = await prisma.doubt.update({
      where: { id: numericDoubtId },
      data: { status: status.toUpperCase(), updatedAt: new Date() },
      include: { user: { select: { id: true, name: true, email: true } } } // For potential notification
    });

    // TODO: Notify the user who posted the doubt about the status change.
    // if (req.io) {
    //   req.io.to(`user-${updatedDoubt.userId}`).emit('doubtStatusUpdate', updatedDoubt);
    // }

    return res
      .status(200)
      .json(new ApiResponse(200, { doubt: updatedDoubt }, 'Doubt status updated successfully by admin.'));
  } catch (error) {
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
    }
    console.error(`Error updating status for doubt ID '${doubtId}' by admin:`, error);
    next(new ApiError(500, 'Failed to update doubt status.', [error.message]));
  }
};

/**
 * @desc    Admin: Assign an instructor to a doubt
 * @route   PUT /api/admin/doubts/:doubtId/assign
 * @access  Private (Admin)
 * @body    { instructorId: number }
 */
export const assignInstructorToDoubtByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { doubtId } = req.params;
  const numericDoubtId = parseInt(doubtId, 10);
  const { instructorId } = req.body;

  if (isNaN(numericDoubtId)) {
    return next(new ApiError(400, 'Invalid Doubt ID format.'));
  }
  if (instructorId === undefined) { // Allow unassigning by passing null or empty string for instructorId
     try {
        const unassignedDoubt = await prisma.doubt.update({
            where: { id: numericDoubtId },
            data: { assignedInstructorId: null, updatedAt: new Date() },
            include: { user: { select: { id: true, name: true } } }
        });
        return res.status(200).json(new ApiResponse(200, { doubt: unassignedDoubt }, 'Instructor unassigned from doubt.'));
     } catch (error) {
        if (error.code === 'P2025') return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
        console.error(`Error unassigning instructor from doubt ID '${doubtId}':`, error);
        return next(new ApiError(500, 'Failed to unassign instructor.', [error.message]));
     }
  }

  const numericInstructorId = parseInt(instructorId, 10);
  if (isNaN(numericInstructorId)) {
    return next(new ApiError(400, 'Invalid Instructor ID format.'));
  }


  try {
    // Verify the assigned user is actually an instructor
    const instructor = await prisma.user.findFirst({
      where: { id: numericInstructorId, role: 'INSTRUCTOR' },
    });
    if (!instructor) {
      return next(new ApiError(404, `Instructor with ID '${instructorId}' not found or is not an instructor.`));
    }

    const updatedDoubt = await prisma.doubt.update({
      where: { id: numericDoubtId },
      data: { assignedInstructorId: numericInstructorId, updatedAt: new Date() },
      include: {
        assignedInstructor: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true } } // User who posted
      }
    });

    // TODO: Notify the assigned instructor and potentially the student.
    // if (req.io) {
    //   req.io.to(`user-${numericInstructorId}`).emit('doubtAssigned', updatedDoubt);
    //   req.io.to(`user-${updatedDoubt.userId}`).emit('doubtUpdate', updatedDoubt);
    // }

    return res
      .status(200)
      .json(new ApiResponse(200, { doubt: updatedDoubt }, 'Instructor assigned to doubt successfully.'));
  } catch (error) {
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
    }
    console.error(`Error assigning instructor to doubt ID '${doubtId}':`, error);
    next(new ApiError(500, 'Failed to assign instructor.', [error.message]));
  }
};

/**
 * @desc    Admin: Delete a doubt message
 * @route   DELETE /api/admin/doubts/:doubtId/messages/:messageId
 * @access  Private (Admin)
 */
export const deleteDoubtMessageByAdmin = async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const numericMessageId = parseInt(messageId, 10);

        if (isNaN(numericMessageId)) {
            return next(new ApiError(400, 'Invalid Message ID format.'));
        }

        const messageExists = await prisma.doubtMessage.findUnique({ where: { id: numericMessageId }});
        if (!messageExists) {
            return next(new ApiError(404, `Message with ID ${numericMessageId} not found.`));
        }

        await prisma.doubtMessage.delete({
            where: { id: numericMessageId }
        });

        // Optionally, emit a socket event to update clients viewing this doubt thread
        // if (req.io) {
        //     req.io.to(`doubt-${messageExists.doubtId}`).emit('messageDeleted', { messageId: numericMessageId, doubtId: messageExists.doubtId });
        // }

        return res.status(200).json(new ApiResponse(200, null, 'Doubt message deleted successfully.'));

    } catch (error) {
        console.error(`Error deleting doubt message ID '${req.params.messageId}':`, error);
        if (error.code === 'P2025') {
            return next(new ApiError(404, `Message not found.`));
        }
        next(new ApiError(500, 'Failed to delete doubt message.', [error.message]));
    }
};

/**
 * @desc    Admin: Delete an entire doubt thread
 * @route   DELETE /api/admin/doubts/:doubtId
 * @access  Private (Admin)
 */
export const deleteDoubtThreadByAdmin = async (req, res, next) => {
    try {
        const { doubtId } = req.params;
        const numericDoubtId = parseInt(doubtId, 10);

        if (isNaN(numericDoubtId)) {
            return next(new ApiError(400, 'Invalid Doubt ID format.'));
        }

        const doubtExists = await prisma.doubt.findUnique({ where: { id: numericDoubtId }});
        if (!doubtExists) {
            return next(new ApiError(404, `Doubt thread with ID ${numericDoubtId} not found.`));
        }

        // Prisma's onDelete: Cascade on DoubtMessage (to Doubt) should handle deleting messages.
        await prisma.doubt.delete({
            where: { id: numericDoubtId }
        });

        // Optionally, emit a socket event if clients might be viewing this doubt
        // if (req.io) {
        //     req.io.to(`doubt-${numericDoubtId}`).emit('doubtThreadDeleted', { doubtId: numericDoubtId });
        //     // Consider how clients should react, e.g., redirect or show a message
        // }

        return res.status(200).json(new ApiResponse(200, null, 'Doubt thread deleted successfully.'));
    } catch (error) {
        console.error(`Error deleting doubt thread ID '${req.params.doubtId}':`, error);
        if (error.code === 'P2025') {
            return next(new ApiError(404, `Doubt thread not found.`));
        }
        next(new ApiError(500, 'Failed to delete doubt thread.', [error.message]));
    }
};
