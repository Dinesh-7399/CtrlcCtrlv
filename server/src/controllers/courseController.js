// server/src/controllers/courseController.js

import prisma from '../config/db.js'; // Assuming path is src/db/db.js again
import { validationResult } from 'express-validator';

// --- Controller to Get All Published Courses ---
export const getAllPublishedCourses = async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnailUrl: true,
        price: true,
        difficulty: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatarUrl: true } }
          },
        },
        _count: {
          select: {
            // lessons: true, // <-- REMOVE THIS LINE
            modules: true,     // You CAN count modules
            enrollments: true, // Counting enrollments is okay
            reviews: true      // Counting reviews is okay
            // Add other direct relations like orders, doubts if needed
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Optional: Calculate total lesson count per course if needed (more processing)
    // This requires fetching modules/lessons or a separate aggregate query
    // const coursesWithLessonCount = courses.map(course => ({
    //     ...course,
    //     // Note: This assumes modules and lessons are loaded, which they aren't with the current SELECT
    //     // totalLessons: course.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) ?? 0
    // }));

    res.status(200).json(courses); // Send original courses for now

  } catch (error) {
    console.error("Error fetching published courses:", error);
    next(error);
  }
};


// --- Controller to Get Single Course by ID or Slug (Keep as before) ---
export const getCourseByIdOrSlug = async (req, res, next) => {
    // ... (existing getCourseByIdOrSlug code remains here) ...
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    const { idOrSlug } = req.params;
    const isNumericId = /^\d+$/.test(idOrSlug);
    try {
        const course = await prisma.course.findFirst({
            where: { published: true, OR: [ isNumericId ? { id: parseInt(idOrSlug, 10) } : {}, { slug: idOrSlug }, ], },
            include: {
                instructor: { select: { id: true, name: true, profile: { select: { headline: true, bio: true, avatarUrl: true } } } },
                category: { select: { name: true, slug: true } },
                modules: { orderBy: { order: 'asc' }, include: { lessons: { where: { published: true }, orderBy: { order: 'asc' }, select: { id: true, title: true, slug: true, type: true, videoDuration: true, isFreePreview: true } } } }
            },
        });
        if (!course) { return res.status(404).json({ message: `Course '${idOrSlug}' not found or is not published.` }); }
        res.status(200).json(course);
    } catch (error) { next(error); }
};