// server/src/controllers/adminUserController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';
// import { hashPassword } from '../utils/passwordHelper.js'; // Only if admin can reset/set passwords

const ADMIN_USERS_PER_PAGE = 15;

/**
 * @desc    Get all users for admin view (with filtering and pagination)
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsersForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ADMIN_USERS_PER_PAGE;
    const skip = (page - 1) * limit;

    const { role, status, searchTerm, sortBy = 'createdAt_desc' } = req.query;

    let whereClause = {};
    if (role) whereClause.role = role.toUpperCase();
    if (status) whereClause.status = status.toUpperCase();

    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { id: { equals: !isNaN(parseInt(searchTerm)) ? parseInt(searchTerm) : undefined } }, // Search by ID if numeric
      ];
    }

    let orderByClause = {};
    switch (sortBy) {
      case 'createdAt_asc': orderByClause = { createdAt: 'asc' }; break;
      case 'name_asc': orderByClause = { name: 'asc' }; break;
      case 'name_desc': orderByClause = { name: 'desc' }; break;
      case 'email_asc': orderByClause = { email: 'asc' }; break;
      case 'email_desc': orderByClause = { email: 'desc' }; break;
      case 'role_asc': orderByClause = { role: 'asc' }; break;
      case 'role_desc': orderByClause = { role: 'desc' }; break;
      case 'createdAt_desc':
      default: orderByClause = { createdAt: 'desc' }; break;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true, // Useful for admin to see
        profile: {
          select: { avatarUrl: true }
        },
        _count: { // Count related items for context
          select: {
            enrollments: true,
            coursesTeaching: true, // If instructor
            articlesAuthored: true,
          }
        }
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(totalUsers / limit);

    const formattedUsers = users.map(user => ({
      ...user,
      avatarUrl: user.profile?.avatarUrl || null,
      enrollmentCount: user._count?.enrollments || 0,
      coursesTeachingCount: user._count?.coursesTeaching || 0,
      articlesAuthoredCount: user._count?.articlesAuthored || 0,
      profile: undefined, // Remove nested profile object after extracting avatar
      _count: undefined,  // Remove count object
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        { users: formattedUsers, currentPage: page, totalPages, totalUsers },
        'Admin: Users fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    next(new ApiError(500, 'Failed to fetch users for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single user by ID (for admin view/editing)
 * @route   GET /api/admin/users/:userId
 * @access  Private (Admin)
 */
export const getUserByIdForAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericUserId)) {
      return next(new ApiError(400, 'Invalid User ID format.'));
    }

    const user = await prisma.user.findUnique({
      where: { id: numericUserId },
      include: { // Include all details admin might need to see/edit
        profile: true,
        // Optionally include counts or brief summaries of related data
        _count: {
          select: {
            enrollments: true,
            coursesTeaching: true,
            articlesAuthored: true,
            doubtsPosted: true,
            reviews: true
          }
        }
      },
    });

    if (!user) {
      return next(new ApiError(404, `User with ID ${numericUserId} not found.`));
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;

    return res
      .status(200)
      .json(new ApiResponse(200, { user: userWithoutPassword }, 'User details fetched for admin.'));
  } catch (error) {
    console.error(`Error fetching user ID '${req.params.userId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch user details for admin.', [error.message]));
  }
};

/**
 * @desc    Admin: Update a user's details (role, status, name, email)
 * @route   PUT /api/admin/users/:userId
 * @access  Private (Admin)
 * @body    { name?: string, email?: string, role?: Role, status?: UserStatus, profileData?: object }
 */
export const updateUserByAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { userId } = req.params;
  const numericUserId = parseInt(userId, 10);
  const adminUserId = req.user.userId; // Admin performing the action

  const {
    name,
    email,
    role, // STUDENT, INSTRUCTOR, ADMIN
    status, // ACTIVE, SUSPENDED
    profileData, // Object for UserProfile fields e.g., { bio, headline, avatarUrl, ... }
  } = req.body;

  if (isNaN(numericUserId)) {
    return next(new ApiError(400, 'Invalid User ID format.'));
  }

  // Prevent an admin from changing their own role or status through this endpoint
  if (numericUserId === adminUserId && (role || status)) {
      if (role && role !== req.user.role) {
        return next(new ApiError(403, 'Admins cannot change their own role via this endpoint.'));
      }
      // Add similar check for status if needed, though an admin might suspend their own account accidentally.
  }


  try {
    const existingUser = await prisma.user.findUnique({ where: { id: numericUserId } });
    if (!existingUser) {
      return next(new ApiError(404, `User with ID ${numericUserId} not found.`));
    }

    // Prevent changing the role of the last admin to non-admin
    if (role && role !== 'ADMIN' && existingUser.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
        if (adminCount <= 1) {
            return next(new ApiError(400, 'Cannot change the role of the last admin.'));
        }
    }


    const userDataToUpdate = {};
    if (name !== undefined && name.trim() !== '') userDataToUpdate.name = name.trim();
    if (email !== undefined && email.trim() !== '' && email !== existingUser.email) {
      // Check if new email is already taken
      const emailExists = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (emailExists && emailExists.id !== numericUserId) {
        return next(new ApiError(409, `Email '${email.trim()}' is already in use.`));
      }
      userDataToUpdate.email = email.trim();
    }
    if (role && Object.values(prisma.Role).includes(role.toUpperCase())) userDataToUpdate.role = role.toUpperCase();
    if (status && Object.values(prisma.UserStatus).includes(status.toUpperCase())) userDataToUpdate.status = status.toUpperCase();

    const profileDataToUpdate = {};
    if (profileData && typeof profileData === 'object') {
        if (profileData.bio !== undefined) profileDataToUpdate.bio = profileData.bio;
        if (profileData.avatarUrl !== undefined) profileDataToUpdate.avatarUrl = profileData.avatarUrl;
        if (profileData.headline !== undefined) profileDataToUpdate.headline = profileData.headline;
        if (profileData.websiteUrl !== undefined) profileDataToUpdate.websiteUrl = profileData.websiteUrl;
        if (profileData.socialLinks !== undefined) profileDataToUpdate.socialLinks = profileData.socialLinks; // Expects JSON
        // Add experience, education, projects if admin can edit these
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
        let userResult;
        if (Object.keys(userDataToUpdate).length > 0) {
            userResult = await tx.user.update({
                where: { id: numericUserId },
                data: userDataToUpdate,
            });
        } else {
            userResult = existingUser; // No changes to user model itself
        }

        if (Object.keys(profileDataToUpdate).length > 0) {
            await tx.userProfile.upsert({
                where: { userId: numericUserId },
                update: profileDataToUpdate,
                create: {
                    userId: numericUserId,
                    ...profileDataToUpdate,
                },
            });
        }
        // Re-fetch the user with profile to return the full updated entity
        return tx.user.findUnique({
            where: { id: numericUserId },
            include: { profile: true }
        });
    });
    
    const { password, ...userWithoutPassword } = updatedUser;


    return res
      .status(200)
      .json(new ApiResponse(200, { user: userWithoutPassword }, 'User details updated successfully by admin.'));

  } catch (error) {
    console.error(`Error updating user ID '${userId}' by admin:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return next(new ApiError(409, `Email '${email}' is already in use.`));
    }
    if (error.code === 'P2025') { // Record to update not found
        return next(new ApiError(404, `User with ID ${userId} not found.`));
    }
    next(new ApiError(500, 'Failed to update user details.', [error.message]));
  }
};

/**
 * @desc    Admin: Delete a user
 * @route   DELETE /api/admin/users/:userId
 * @access  Private (Admin)
 */
export const deleteUserByAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const numericUserId = parseInt(userId, 10);
    const adminUserId = req.user.userId;

    if (isNaN(numericUserId)) {
      return next(new ApiError(400, 'Invalid User ID format.'));
    }

    // Prevent admin from deleting themselves
    if (numericUserId === adminUserId) {
      return next(new ApiError(403, 'Administrators cannot delete their own account.'));
    }

    const userToDelete = await prisma.user.findUnique({ where: { id: numericUserId } });
    if (!userToDelete) {
      return next(new ApiError(404, `User with ID ${numericUserId} not found.`));
    }

    // Prevent deletion of the last admin account
    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return next(new ApiError(400, 'Cannot delete the last administrator account.'));
      }
    }

    // Prisma's onDelete: Cascade on UserProfile, Enrollment, etc., will handle related data.
    // If not using cascade, you'd need to manually delete or handle related records.
    await prisma.user.delete({
      where: { id: numericUserId },
    });

    return res
      .status(200) // Or 204 No Content
      .json(new ApiResponse(200, null, `User (ID: ${numericUserId}) deleted successfully.`));
  } catch (error) {
    console.error(`Error deleting user ID '${req.params.userId}' by admin:`, error);
    if (error.code === 'P2025') { // Record to delete not found
        return next(new ApiError(404, `User with ID '${req.params.userId}' not found.`));
    }
    // P2003 can happen if related records prevent deletion and cascade isn't set up correctly
    next(new ApiError(500, 'Failed to delete user.', [error.message]));
  }
};
