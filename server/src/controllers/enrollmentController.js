// server/src/controllers/enrollmentController.js

import prisma from '../config/db.js'; // Adjust path as needed
import { validationResult } from 'express-validator';

/**
 * @description Enroll the logged-in user in a specific course.
 * @route POST /api/enrollments/course/:courseId
 * @access Private (Authenticated Users)
 */
export const enrollInCourse = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id; // From requireAuth middleware
    const courseId = req.params.courseId; // Already parsed toInt by validation

    try {
        // 1. Check if the course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, published: true, price: true } // Select price for future payment check
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (!course.published) {
            return res.status(403).json({ message: 'This course is not available for enrollment.' });
        }

        // 2. Check if user is already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { // Using the compound unique key
                    userId: userId,
                    courseId: courseId,
                }
            }
        });

        if (existingEnrollment) {
            return res.status(409).json({ message: 'You are already enrolled in this course.' }); // 409 Conflict
        }

        // 3. For now, direct enrollment (no payment check for free courses or initial setup)
        // TODO: Add payment check here later if course.price > 0

        // 4. Create the enrollment record
        const newEnrollment = await prisma.enrollment.create({
            data: {
                userId: userId,
                courseId: courseId,
                // enrolledAt is @default(now())
            },
            include: { // Include course title for the response
                course: { select: { title: true } }
            }
        });

        res.status(201).json({
            message: `Successfully enrolled in "${newEnrollment.course.title}".`,
            enrollment: {
                courseId: newEnrollment.courseId,
                enrolledAt: newEnrollment.enrolledAt
            }
        });

    } catch (error) {
        console.error(`Error enrolling user ${userId} in course ${courseId}:`, error);
        if (error.code === 'P2003') { // Foreign key constraint (e.g., courseId or userId invalid)
             return res.status(400).json({ message: 'Invalid course or user ID for enrollment.' });
        }
        next(error);
    }
};

// If you decide to move getMyEnrollments here:
// export const getMyEnrollmentsForController = async (req, res, next) => { /* ... logic from userController ... */ };
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