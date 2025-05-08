// server/src/controllers/userController.js

import prisma from '../config/db.js'; // Ensure path is correct for your structure (e.g., ../config/db.js or ../db/db.js)
import { validationResult } from 'express-validator';

// --- Get Logged-in User's Profile (Keep as before) ---
export const getUserProfile = async (req, res, next) => {
  // ... (existing getUserProfile code remains here) ...
    const userId = req.user?.id;
    if (!userId) { return res.status(401).json({ message: 'Unauthorized: User context not found.' }); }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true, updatedAt: true,
                profile: { select: { bio: true, avatarUrl: true, headline: true, websiteUrl: true, socialLinks: true, experience: true, education: true, projects: true } }
            },
        });
        if (!user) { return res.status(404).json({ message: 'User not found.' }); }
        res.status(200).json(user);
    } catch (error) { next(error); }
};

// --- Update Logged-in User's Profile/Settings (Keep as before) ---
export const updateMySettings = async (req, res, next) => {
    // ... (existing updateMySettings code remains here) ...
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const userId = req.user?.id;
    if (!userId) { return res.status(401).json({ message: 'Unauthorized: User context not found.' }); }
    const { name, bio, headline, avatarUrl, websiteUrl, socialLinks } = req.body;
    const userDataToUpdate = {}; if (name !== undefined) userDataToUpdate.name = name;
    const profileDataToUpdate = {}; if (bio !== undefined) profileDataToUpdate.bio = bio; if (headline !== undefined) profileDataToUpdate.headline = headline; if (avatarUrl !== undefined) profileDataToUpdate.avatarUrl = avatarUrl; if (websiteUrl !== undefined) profileDataToUpdate.websiteUrl = websiteUrl; if (socialLinks !== undefined) profileDataToUpdate.socialLinks = socialLinks;
    try {
        const updatedUser = await prisma.$transaction(async (tx) => { /* ... transaction logic ... */
             let userResult;
            if (Object.keys(userDataToUpdate).length > 0) {
                userResult = await tx.user.update({ where: { id: userId }, data: userDataToUpdate, select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true, updatedAt: true }});
            } else {
                 userResult = await tx.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true, updatedAt: true }});
                 if (!userResult) throw new Error("User not found during update.");
            }
            let finalProfileData = null;
            if (Object.keys(profileDataToUpdate).length > 0) {
                 finalProfileData = await tx.userProfile.upsert({ where: { userId: userId }, update: profileDataToUpdate, create: { userId: userId, ...profileDataToUpdate }, select: { bio: true, avatarUrl: true, headline: true, websiteUrl: true, socialLinks: true, experience: true, education: true, projects: true }});
            } else {
                 finalProfileData = await tx.userProfile.findUnique({ where: { userId: userId }, select: { bio: true, avatarUrl: true, headline: true, websiteUrl: true, socialLinks: true, experience: true, education: true, projects: true }});
            }
            return { ...userResult, profile: finalProfileData };
        });
        res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (error) { next(error); }
};


// --- Get Public User Profile (e.g., for Instructor Page) --- NEW FUNCTION ---
export const getPublicUserProfile = async (req, res, next) => {
  // 1. Check validation results for URL parameter
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Invalid User ID format
  }

  // 2. Get target user ID from URL params
  // Make sure to parse it as an integer
  const targetUserId = parseInt(req.params.userId, 10);

  try {
    // 3. Find the target user and their profile data
    const targetUser = await prisma.user.findUnique({
      where: {
        id: targetUserId,
        // Optional: Only fetch if they are an INSTRUCTOR if that's the requirement
        // role: 'INSTRUCTOR',
      },
      select: { // Select ONLY public-safe information
        id: true,
        name: true,
        role: true, // Frontend might use this to conditionally show sections
        profile: {
          select: {
            bio: true,
            avatarUrl: true,
            headline: true,
            websiteUrl: true,
            socialLinks: true,
            experience: true,  // Include these Json fields
            education: true,
            projects: true
          }
        },
        // Optionally include published courses taught by this instructor
        coursesTeaching: {
             where: { published: true }, // Only show published courses
             select: {
                 id: true,
                 title: true,
                 slug: true,
                 thumbnailUrl: true,
                 category: { select: { name: true } } // Example: Include category name
             }
        }
      },
    });

    // 4. If user not found (or not an instructor, if role filter was added)
    if (!targetUser) {
      return res.status(404).json({ message: 'Public profile not found or user is not an instructor.' });
    }

     // 5. Optional: Filter profile fields based on role before sending
     //    (Though selecting only public fields is generally better)
    //    if(targetUser.role !== 'INSTRUCTOR') {
    //       // Maybe remove experience, education, projects if user is not instructor?
    //       if(targetUser.profile) {
    //          delete targetUser.profile.experience;
    //          // etc...
    //       }
    //    }

    // 6. Send the public profile data
    res.status(200).json(targetUser);

  } catch (error) {
    console.error("Error fetching public user profile:", error);
    next(error); // Pass to global error handler
  }
};

// --- NEW: Get Logged-in User's Enrolled Courses ---
export const getMyEnrollments = async (req, res, next) => {
  const userId = req.user?.id; // From requireAuth middleware

  if (!userId) {
    // This should ideally not be reached if requireAuth is working
    return res.status(401).json({ message: 'Unauthorized: User context not found.' });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: userId,
      },
      include: { // Include details of the enrolled course
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnailUrl: true,
            description: true, // Or a short excerpt
            instructor: { // Include instructor's name
              select: {
                name: true,
              }
            },
            // You might want to include the first lesson ID for a "Continue Learning" link
            modules: {
              orderBy: { order: 'asc'},
              take: 1,
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                  take: 1,
                  select: { id: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc', // Show most recent enrollments first
      }
    });

    // Transform the data to make it more frontend-friendly
    const enrolledCoursesDetails = enrollments.map(enrollment => {
        const firstLessonId = enrollment.course?.modules?.[0]?.lessons?.[0]?.id || null;
        return {
            ...enrollment.course,
            enrolledAt: enrollment.enrolledAt,
            firstLessonId: firstLessonId,
            // modules: undefined // Optionally remove modules if only firstLessonId is needed
        };
    });

    res.status(200).json(enrolledCoursesDetails);

  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    next(error);
  }
};