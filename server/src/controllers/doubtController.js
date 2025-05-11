// server/src/controllers/doubtController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

const DOUBTS_PER_PAGE = 15;

/**
 * @desc    Create a new doubt/question
 * @route   POST /api/doubts
 * @access  Private (Authenticated users)
 */
export const createDoubt = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { title, description, courseId, lessonId, tags } = req.body;
  const userId = req.user.userId; // From authMiddleware

  try {
    const doubtData = {
      title,
      description,
      userId,
      tags: Array.isArray(tags) ? tags.filter(tag => typeof tag === 'string' && tag.trim() !== '') : [],
    };

    if (courseId) doubtData.courseId = parseInt(courseId, 10);
    if (lessonId) doubtData.lessonId = parseInt(lessonId, 10);

    // TODO: Potentially assign to an instructor automatically based on course or round-robin, or leave unassigned.
    // For now, it will be unassigned.

    const newDoubt = await prisma.doubt.create({
      data: doubtData,
      include: { // Include related data in the response
        user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        course: { select: { id: true, title: true, slug: true } },
        lesson: { select: { id: true, title: true, slug: true } },
      }
    });

    // You might want to emit a socket event here to notify relevant parties (e.g., instructors of the course)
    // req.io.to(`course-${courseId}`).emit('newDoubt', newDoubt); // Example

    return res
      .status(201)
      .json(new ApiResponse(201, { doubt: newDoubt }, 'Doubt created successfully.'));

  } catch (error) {
    console.error('Error creating doubt:', error);
    next(new ApiError(500, 'Failed to create doubt.', [error.message]));
  }
};

/**
 * @desc    Get all doubts (with filtering and pagination)
 * @route   GET /api/doubts
 * @access  Public (or Private if only for logged-in users)
 */
export const getAllDoubts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || DOUBTS_PER_PAGE;
    const skip = (page - 1) * limit;

    const {
      courseId,
      lessonId,
      userId: filterUserId, // Doubts by a specific user
      status,              // OPEN, RESOLVED, CLOSED
      tags,                // Comma-separated string of tags
      searchTerm,
      sortBy = 'newest',   // newest, oldest, mostMessages (future), unanswered (OPEN and few messages)
    } = req.query;

    let whereClause = {};
    if (courseId) whereClause.courseId = parseInt(courseId, 10);
    if (lessonId) whereClause.lessonId = parseInt(lessonId, 10);
    if (filterUserId) whereClause.userId = parseInt(filterUserId, 10);
    if (status) whereClause.status = status.toUpperCase();
    if (tags) whereClause.tags = { hasSome: tags.split(',').map(tag => tag.trim()).filter(Boolean) };

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    let orderByClause = {};
    switch (sortBy) {
      case 'oldest':
        orderByClause = { createdAt: 'asc' };
        break;
      // Add more complex sorting like 'mostMessages' or 'unanswered' later
      case 'newest':
      default:
        orderByClause = { createdAt: 'desc' };
        break;
    }

    const doubts = await prisma.doubt.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }, // Asker
        course: { select: { id: true, title: true, slug: true } }, // Associated course
        lesson: { select: { id: true, title: true, slug: true } }, // Associated lesson
        assignedInstructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } }, // Assigned instructor
        _count: { select: { messages: true } }, // Count of messages
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalDoubts = await prisma.doubt.count({ where: whereClause });
    const totalPages = Math.ceil(totalDoubts / limit);

    const formattedDoubts = doubts.map(doubt => ({
        ...doubt,
        user: {
            id: doubt.user.id,
            name: doubt.user.name,
            avatarUrl: doubt.user.profile?.avatarUrl || null
        },
        assignedInstructor: doubt.assignedInstructor ? {
            id: doubt.assignedInstructor.id,
            name: doubt.assignedInstructor.name,
            avatarUrl: doubt.assignedInstructor.profile?.avatarUrl || null
        } : null,
        messageCount: doubt._count?.messages || 0,
        _count: undefined, // Clean up
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
        'Doubts fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching doubts:', error);
    next(new ApiError(500, 'Failed to fetch doubts.', [error.message]));
  }
};

/**
 * @desc    Get a single doubt by its ID, including its messages
 * @route   GET /api/doubts/:doubtId
 * @access  Private (Authenticated users, or public if Q&A is public)
 */
export const getDoubtById = async (req, res, next) => {
  try {
    const { doubtId } = req.params;
    const numericDoubtId = parseInt(doubtId, 10);

    if (isNaN(numericDoubtId)) {
      return next(new ApiError(400, 'Invalid Doubt ID format.'));
    }

    const doubt = await prisma.doubt.findUnique({
      where: { id: numericDoubtId },
      include: {
        user: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        course: { select: { id: true, title: true, slug: true } },
        lesson: { select: { id: true, title: true, slug: true } },
        assignedInstructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
        messages: {
          orderBy: { sentAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, role: true, profile: { select: { avatarUrl: true } } } }, // User who sent the message
          },
        },
      },
    });

    if (!doubt) {
      return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
    }
    
    const formattedDoubt = {
        ...doubt,
        user: {
            id: doubt.user.id,
            name: doubt.user.name,
            avatarUrl: doubt.user.profile?.avatarUrl || null
        },
        assignedInstructor: doubt.assignedInstructor ? {
            id: doubt.assignedInstructor.id,
            name: doubt.assignedInstructor.name,
            avatarUrl: doubt.assignedInstructor.profile?.avatarUrl || null
        } : null,
        messages: doubt.messages.map(msg => ({
            ...msg,
            user: {
                id: msg.user.id,
                name: msg.user.name,
                role: msg.user.role,
                avatarUrl: msg.user.profile?.avatarUrl || null
            }
        }))
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { doubt: formattedDoubt }, 'Doubt details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching doubt ID '${req.params.doubtId}':`, error);
    if (error.code === 'P2025' || error.code === 'P2023') {
        return next(new ApiError(404, `Doubt with ID '${req.params.doubtId}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch doubt details.', [error.message]));
  }
};

/**
 * @desc    Post a message to a doubt thread
 * @route   POST /api/doubts/:doubtId/messages
 * @access  Private (Authenticated users, typically student who asked or assigned instructor/admin)
 */
export const postMessageToDoubt = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { doubtId } = req.params;
  const numericDoubtId = parseInt(doubtId, 10);
  const { content } = req.body;
  const userId = req.user.userId; // From authMiddleware

  if (isNaN(numericDoubtId)) {
    return next(new ApiError(400, 'Invalid Doubt ID format.'));
  }

  try {
    // 1. Check if doubt exists
    const doubt = await prisma.doubt.findUnique({ where: { id: numericDoubtId } });
    if (!doubt) {
      return next(new ApiError(404, 'Doubt thread not found.'));
    }

    // 2. Authorization: Check if user is allowed to post
    // (e.g., original asker, assigned instructor, or an admin)
    const isAsker = doubt.userId === userId;
    const isAssignedInstructor = doubt.assignedInstructorId === userId;
    const isAdmin = req.user.role === 'ADMIN'; // Assuming role is on req.user

    if (!isAsker && !isAssignedInstructor && !isAdmin) {
      return next(new ApiError(403, 'You are not authorized to post in this doubt thread.'));
    }

    // 3. Create the message
    const newMessage = await prisma.doubtMessage.create({
      data: {
        doubtId: numericDoubtId,
        userId,
        content,
        // isBot: false, // Default is false
      },
      include: {
        user: { select: { id: true, name: true, role: true, profile: { select: { avatarUrl: true } } } },
      },
    });
    
    const formattedMessage = {
        ...newMessage,
        user: {
            id: newMessage.user.id,
            name: newMessage.user.name,
            role: newMessage.user.role,
            avatarUrl: newMessage.user.profile?.avatarUrl || null
        }
    };

    // 4. Emit socket event to other users in the doubt room
    if (req.io) { // Check if io is attached to req (from server.js setup)
      req.io.to(`doubt-${numericDoubtId}`).emit('receiveDoubtMessage', formattedMessage);
    } else {
      console.warn('Socket.IO instance (req.io) not found. Real-time update will not be sent.');
    }

    // 5. Optionally, update doubt status if an instructor/admin posts (e.g., to 'OPEN' if it was 'RESOLVED' by AI)
    if ((isAssignedInstructor || isAdmin) && doubt.status !== 'OPEN') {
        await prisma.doubt.update({
            where: { id: numericDoubtId },
            data: { status: 'OPEN', updatedAt: new Date() } // Re-open if instructor/admin replies
        });
    }


    return res
      .status(201)
      .json(new ApiResponse(201, { message: formattedMessage }, 'Message posted successfully.'));

  } catch (error) {
    console.error(`Error posting message to doubt ID '${doubtId}':`, error);
    next(new ApiError(500, 'Failed to post message.', [error.message]));
  }
};

// --- Admin/Instructor specific actions ---

/**
 * @desc    Update the status of a doubt
 * @route   PUT /api/doubts/:doubtId/status
 * @access  Private (Instructor or Admin)
 */
export const updateDoubtStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { doubtId } = req.params;
  const numericDoubtId = parseInt(doubtId, 10);
  const { status } = req.body; // Expected: OPEN, RESOLVED, CLOSED

  if (isNaN(numericDoubtId)) {
    return next(new ApiError(400, 'Invalid Doubt ID format.'));
  }
  if (!status || !['OPEN', 'RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
    return next(new ApiError(400, 'Invalid status provided. Must be OPEN, RESOLVED, or CLOSED.'));
  }

  try {
    const updatedDoubt = await prisma.doubt.update({
      where: { id: numericDoubtId },
      data: { status: status.toUpperCase() },
      include: { user: { select: { id: true, name: true } } } // Include user for potential notification
    });

    // TODO: Notify the user who posted the doubt about the status change.

    return res
      .status(200)
      .json(new ApiResponse(200, { doubt: updatedDoubt }, 'Doubt status updated successfully.'));
  } catch (error) {
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `Doubt with ID '${doubtId}' not found.`));
    }
    console.error(`Error updating status for doubt ID '${doubtId}':`, error);
    next(new ApiError(500, 'Failed to update doubt status.', [error.message]));
  }
};

/**
 * @desc    Assign an instructor to a doubt
 * @route   PUT /api/doubts/:doubtId/assign
 * @access  Private (Admin)
 */
export const assignInstructorToDoubt = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { doubtId } = req.params;
  const numericDoubtId = parseInt(doubtId, 10);
  const { instructorId } = req.body; // ID of the user with INSTRUCTOR role

  if (isNaN(numericDoubtId)) {
    return next(new ApiError(400, 'Invalid Doubt ID format.'));
  }
  if (!instructorId || isNaN(parseInt(instructorId, 10))) {
    return next(new ApiError(400, 'Valid Instructor ID is required.'));
  }
  const numericInstructorId = parseInt(instructorId, 10);

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
      data: { assignedInstructorId: numericInstructorId },
      include: { assignedInstructor: { select: { id: true, name: true } } }
    });

    // TODO: Notify the assigned instructor.

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
