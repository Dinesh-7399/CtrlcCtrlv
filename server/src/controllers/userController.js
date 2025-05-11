// server/src/controllers/userController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get a user's public profile (especially for instructors)
 * @route   GET /api/users/:userId/profile
 * @access  Public
 */
export const getUserPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericUserId)) {
      return next(new ApiError(400, 'Invalid User ID format.'));
    }

    const userWithProfile = await prisma.user.findUnique({
      where: { id: numericUserId },
      select: {
        id: true,
        name: true,
        email: false, // Typically don't expose email publicly unless intended
        role: true,   // To confirm if it's an instructor, etc.
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            headline: true,
            websiteUrl: true,
            socialLinks: true,
            experience: true,
            education: true,
            projects: true,
          },
        },
        // Optionally, include courses taught if this is for an instructor profile
        coursesTeaching: {
          where: { status: 'PUBLISHED' }, // Only show published courses
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            category: { select: { name: true, slug: true } },
            // _count: { select: { enrollments: true } } // Optional: student count per course
          },
          orderBy: { createdAt: 'desc' },
          take: 6, // Limit number of courses shown on profile, or paginate
        },
      },
    });

    if (!userWithProfile) {
      return next(new ApiError(404, `User with ID ${numericUserId} not found.`));
    }

    // If this route is specifically for instructors, you might add a role check:
    // if (userWithProfile.role !== 'INSTRUCTOR') {
    //   return next(new ApiError(404, `Instructor with ID ${numericUserId} not found.`));
    // }
    
    // Flatten the profile data for easier consumption
    const publicProfile = {
        id: userWithProfile.id,
        name: userWithProfile.name,
        role: userWithProfile.role,
        ...(userWithProfile.profile || {}), // Spread profile fields, or empty object if no profile
        coursesTaught: userWithProfile.coursesTeaching || [],
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { profile: publicProfile }, 'User profile fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching profile for user ID '${req.params.userId}':`, error);
    if (error.code === 'P2025' || error.code === 'P2023') {
        return next(new ApiError(404, `User with ID '${req.params.userId}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch user profile.', [error.message]));
  }
};

/**
 * @desc    Update the current authenticated user's profile information
 * @route   PUT /api/users/me/profile  (or /api/users/me/settings for all user settings)
 * @access  Private (Authenticated Users via authMiddleware)
 * @body    { name?: string, bio?: string, avatarUrl?: string, headline?: string, websiteUrl?: string, socialLinks?: object, experience?: array, education?: array, projects?: array }
 */
export const updateMyProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const userId = req.user.userId; // From authMiddleware
  const {
    name, // From User model
    // Fields for UserProfile model
    bio,
    avatarUrl, // Assume this is a URL string; actual file upload handled by uploadController
    headline,
    websiteUrl,
    socialLinks, // Expected to be an object e.g., { linkedin: "...", github: "..." }
    experience,  // Expected to be an array of objects
    education,   // Expected to be an array of objects
    projects,    // Expected to be an array of objects
  } = req.body;

  try {
    // Prepare data for User update (only name for now)
    const userDataToUpdate = {};
    if (typeof name === 'string') {
      userDataToUpdate.name = name.trim();
    }

    // Prepare data for UserProfile update/create
    const userProfileDataToUpdate = {};
    if (typeof bio === 'string') userProfileDataToUpdate.bio = bio;
    if (typeof avatarUrl === 'string') userProfileDataToUpdate.avatarUrl = avatarUrl; // Store URL
    if (typeof headline === 'string') userProfileDataToUpdate.headline = headline;
    if (typeof websiteUrl === 'string') userProfileDataToUpdate.websiteUrl = websiteUrl;
    if (typeof socialLinks === 'object' && socialLinks !== null) userProfileDataToUpdate.socialLinks = socialLinks;
    if (Array.isArray(experience)) userProfileDataToUpdate.experience = experience;
    if (Array.isArray(education)) userProfileDataToUpdate.education = education;
    if (Array.isArray(projects)) userProfileDataToUpdate.projects = projects;

    // Use a transaction to update User and UserProfile together
    const updatedUser = await prisma.$transaction(async (tx) => {
      let userResult;
      if (Object.keys(userDataToUpdate).length > 0) {
        userResult = await tx.user.update({
          where: { id: userId },
          data: userDataToUpdate,
          select: { id: true, name: true, email: true, role: true } // Select basic info
        });
      } else {
        // If only profile is being updated, fetch the user to return consistent data
        userResult = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true }
        });
      }

      if (!userResult) {
        throw new ApiError(404, 'User not found for profile update.');
      }

      let profileResult;
      if (Object.keys(userProfileDataToUpdate).length > 0) {
        profileResult = await tx.userProfile.upsert({
          where: { userId: userId },
          update: userProfileDataToUpdate,
          create: {
            userId: userId,
            ...userProfileDataToUpdate,
          },
        });
      } else {
        profileResult = await tx.userProfile.findUnique({ where: { userId: userId } });
      }
      
      return { ...userResult, profile: profileResult || {} };
    });
    
    const responseUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.profile?.bio,
        avatarUrl: updatedUser.profile?.avatarUrl,
        headline: updatedUser.profile?.headline,
        websiteUrl: updatedUser.profile?.websiteUrl,
        socialLinks: updatedUser.profile?.socialLinks,
        experience: updatedUser.profile?.experience,
        education: updatedUser.profile?.education,
        projects: updatedUser.profile?.projects,
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { user: responseUser }, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof ApiError) return next(error); // Re-throw ApiError
    next(new ApiError(500, 'Failed to update profile.', [error.message]));
  }
};

// Note: User Deletion is a sensitive operation.
// It might be handled by an adminController or have more stringent checks.
// For self-deletion, it might involve password confirmation.
