// server/src/controllers/userController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

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
        email: false, 
        role: true,   
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
        coursesTeaching: {
          where: { status: 'PUBLISHED' }, 
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            category: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6, 
        },
      },
    });

    if (!userWithProfile) {
      return next(new ApiError(404, `User with ID ${numericUserId} not found.`));
    }
    
    const publicProfile = {
        id: userWithProfile.id,
        name: userWithProfile.name,
        role: userWithProfile.role,
        ...(userWithProfile.profile || {}), 
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

export const updateMyProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const userId = req.user.id; // CORRECTED
  const {
    name, 
  } = req.body; // Direct fields for User model

  const { // Fields for UserProfile model, potentially nested under 'profileData' or at root
    bio, avatarUrl, headline, websiteUrl, socialLinks, 
    experience, education, projects
  } = req.body.profileData || req.body;


  try {
    const userDataToUpdate = {};
    if (name !== undefined && typeof name === 'string') { 
      userDataToUpdate.name = name.trim();
    }

    const userProfileDataToUpdate = {};
    if (typeof bio === 'string') userProfileDataToUpdate.bio = bio;
    if (typeof avatarUrl === 'string') userProfileDataToUpdate.avatarUrl = avatarUrl;
    if (typeof headline === 'string') userProfileDataToUpdate.headline = headline;
    if (typeof websiteUrl === 'string') userProfileDataToUpdate.websiteUrl = websiteUrl;
    if (typeof socialLinks === 'object' && socialLinks !== null) userProfileDataToUpdate.socialLinks = socialLinks;
    if (Array.isArray(experience)) userProfileDataToUpdate.experience = experience;
    if (Array.isArray(education)) userProfileDataToUpdate.education = education;
    if (Array.isArray(projects)) userProfileDataToUpdate.projects = projects;

    const updatedUser = await prisma.$transaction(async (tx) => {
      let userResult;
      if (Object.keys(userDataToUpdate).length > 0) {
        userResult = await tx.user.update({
          where: { id: userId },
          data: userDataToUpdate,
          select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
        });
      } else {
        userResult = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
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
    
    // Ensure the response structure matches what the frontend (UsersSlice) expects
    const responseUser = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status, // Ensure status is part of the response
        createdAt: updatedUser.createdAt, // Ensure createdAt is part of the response
        bio: updatedUser.profile?.bio,
        avatarUrl: updatedUser.profile?.avatarUrl,
        headline: updatedUser.profile?.headline,
        websiteUrl: updatedUser.profile?.websiteUrl,
        socialLinks: updatedUser.profile?.socialLinks,
        experience: updatedUser.profile?.experience,
        education: updatedUser.profile?.education,
        projects: updatedUser.profile?.projects,
        // Include notificationPreferences if they are part of the User or UserProfile model directly
        // notificationPreferences: updatedUser.profile?.notificationPreferences || updatedUser.notificationPreferences
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: responseUser }, 'Profile updated successfully.'));

  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof ApiError) return next(error);
    next(new ApiError(500, 'Failed to update profile.', [error.message]));
  }
};