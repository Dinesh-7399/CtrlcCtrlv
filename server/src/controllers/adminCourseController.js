// server/src/controllers/adminCourseController.js

import prisma from '../config/db.js'; // <-- Double-check this path is correct for your structure!
import { validationResult } from 'express-validator';
import slugify from 'slugify';

// --- Helper for Slug Generation ---
const generateUniqueSlug = async (title) => {
  let baseSlug = slugify(title, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
  if (!baseSlug) { baseSlug = `course-${Date.now()}`; }
  let uniqueSlug = baseSlug;
  let counter = 1;
  try {
    while (await prisma.course.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  } catch (error) {
    console.error("Error checking slug uniqueness:", error);
    uniqueSlug = `${baseSlug}-${Date.now()}`;
  }
  return uniqueSlug;
};

// --- Controller Implementations ---

/**
 * @description Get ALL courses (published and draft) for Admin view
 * @route GET /api/admin/courses
 * @access Private (Admin)
 */
export const adminGetAllCourses = async (req, res, next) => {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    // Basic validation for pagination parameters
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) { // Added validation
        return res.status(400).json({ message: 'Invalid pagination parameters.' });
    }

    try {
        const [courses, totalCount] = await prisma.$transaction([
            prisma.course.findMany({
                skip: skip,
                take: limit,
                include: {
                    instructor: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                    _count: { select: { modules: true, enrollments: true, reviews: true } } // Removed 'lessons' count
                },
                orderBy: { updatedAt: 'desc' },
            }),
            prisma.course.count()
        ]);

        res.status(200).json({
             message: 'Admin: Courses retrieved successfully.',
             data: courses,
             pagination: {
                 currentPage: page,
                 totalPages: Math.ceil(totalCount / limit),
                 totalCourses: totalCount,
                 pageSize: limit
             }
         });
    } catch (error) {
        console.error("Admin Error fetching all courses:", error);
        next(error);
    }
};

/**
 * @description Get a specific course details (admin view - including unpublished content)
 * @route GET /api/admin/courses/:courseId
 * @access Private (Admin or Instructor Owner)
 */
export const adminGetCourseById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const courseId = parseInt(req.params.courseId, 10); // Already validated as int > 0 by router
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true } } } },
                category: { select: { id: true, name: true, slug: true } },
                modules: {
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: { // Include ALL lessons for admin view
                            orderBy: { order: 'asc' },
                            select: { // Select fields needed for listing in admin edit
                                id: true, title: true, slug: true, type: true, order: true,
                                videoDuration: true, isFreePreview: true
                                // 'published' field doesn't exist on Lesson model
                            }
                        }
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ message: `Course with ID ${courseId} not found.` });
        }

        // Authorization check (redundant if middleware worked, but safe)
        if (requestingUserRole !== 'ADMIN' && course.instructorId !== requestingUserId) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to view these course details.' });
        }

        res.status(200).json(course);

    } catch (error) {
        console.error(`Admin Error fetching course ${courseId}:`, error);
        next(error);
    }
};


/**
 * @description Create a new course
 * @route POST /api/admin/courses
 * @access Private (Admin)
 */
export const adminCreateCourse = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const adminUserId = req.user.id;
    const { title, description, price, instructorId, categoryId, difficulty, language, published, thumbnailUrl } = req.body;

    // Determine and validate the instructor ID
    const parsedInstructorId = instructorId ? parseInt(instructorId, 10) : adminUserId;
    if (isNaN(parsedInstructorId)) {
        return res.status(400).json({ message: 'Invalid Instructor ID format provided.' });
    }
    const finalInstructorId = parsedInstructorId;

    // Validate Category ID if provided
    let finalCategoryId = null;
    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
        const parsedCategoryId = parseInt(categoryId, 10);
        if (isNaN(parsedCategoryId)) {
            return res.status(400).json({ message: 'Invalid Category ID format provided.' });
        }
        finalCategoryId = parsedCategoryId;
    }

    try {
        // Verify the chosen instructor actually exists
        console.log(`Checking existence for instructor ID: ${finalInstructorId}`); // Log ID being checked
        const instructorExists = await prisma.user.findUnique({ where: { id: finalInstructorId } });
        if (!instructorExists) {
            return res.status(400).json({ message: `Invalid input: User with ID ${finalInstructorId} not found.` });
        }
        console.log(`Instructor ${finalInstructorId} exists.`);

        // Verify category exists if categoryId is provided
        if (finalCategoryId !== null) {
            console.log(`Checking existence for category ID: ${finalCategoryId}`); // Log ID being checked
            const categoryExists = await prisma.category.findUnique({ where: { id: finalCategoryId } });
            if (!categoryExists) {
                return res.status(400).json({ message: `Invalid input: Category with ID ${finalCategoryId} not found.` });
            }
            console.log(`Category ${finalCategoryId} exists.`);
        }

        // Generate a unique slug
        const slug = await generateUniqueSlug(title);
        console.log(`Generated slug: ${slug}`);

        // Prepare data for creation
        const courseData = {
            title,
            slug,
            description,
            price: price ? parseFloat(price) : 0,
            instructorId: finalInstructorId,
            categoryId: finalCategoryId, // Use validated & parsed ID or null
            difficulty: difficulty || 'ALL_LEVELS',
            language: language || 'English',
            published: published === true || published === 'true', // Ensure boolean
            thumbnailUrl: thumbnailUrl || null,
        };

        console.log('Attempting to create course with data:', courseData); // Log data before creation

        // Create the course
        const newCourse = await prisma.course.create({
            data: courseData,
            include: { // Include relations in the response
                 instructor: { select: { id: true, name: true } },
                 category: { select: { id: true, name: true } },
            }
        });

        console.log('Course created successfully:', newCourse.id);
        res.status(201).json({ message: 'Course created successfully.', course: newCourse });

    } catch (error) {
        console.error("Admin Error creating course:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
             return res.status(409).json({ message: 'Conflict: A course with a similar title/slug already exists.' });
        }
         // P2003 can happen if, despite checks, data becomes inconsistent (very rare) or if other FKs fail
         if (error.code === 'P2003') {
             const constraint = error.meta?.constraint || 'unknown foreign key';
              console.error(`Foreign key constraint violation: ${constraint}`);
              return res.status(400).json({ message: `Invalid input: Referenced data not found (${constraint}).` });
         }
        next(error); // Pass to global error handler
    }
};

/**
 * @description Update a course
 * @route PUT /api/admin/courses/:courseId
 * @access Private (Admin or Instructor Owner)
 */
export const adminUpdateCourse = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const courseId = parseInt(req.params.courseId, 10);
    const { role: userRole, id: userId } = req.user;
    const { title, description, price, instructorId, categoryId, published, difficulty, language, thumbnailUrl, slug } = req.body;

    const dataToUpdate = {};

    // Conditionally build update object, parsing numbers/booleans
    if (title !== undefined) dataToUpdate.title = title;
    if (slug !== undefined) dataToUpdate.slug = slug;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = parseFloat(price) || 0;
    if (categoryId !== undefined) dataToUpdate.categoryId = categoryId ? parseInt(categoryId, 10) : null; // Allow setting back to null
    if (published !== undefined) dataToUpdate.published = Boolean(published === true || published === 'true');
    if (difficulty !== undefined) dataToUpdate.difficulty = difficulty;
    if (language !== undefined) dataToUpdate.language = language;
    if (thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = thumbnailUrl;

    try {
         // --- Instructor ID Update Logic (Admin Only) ---
        if (instructorId !== undefined) {
            if (userRole === 'ADMIN') {
                const parsedInstructorId = parseInt(instructorId, 10);
                 if (isNaN(parsedInstructorId)) return res.status(400).json({ message: 'Invalid Instructor ID format provided.' });
                const instructorExists = await prisma.user.findUnique({ where: { id: parsedInstructorId }});
                if (!instructorExists) return res.status(400).json({ message: `Invalid input: New instructor with ID ${parsedInstructorId} not found.` });
                dataToUpdate.instructorId = parsedInstructorId;
            } else {
                console.warn(`Non-admin user ${userId} attempted to change instructorId on course ${courseId}. Ignoring.`);
            }
        }
        // --- End Instructor ID Update Logic ---

        // --- Slug Handling ---
        if (dataToUpdate.title && slug === undefined) {
            const currentCourse = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true }});
            if (currentCourse && currentCourse.title !== dataToUpdate.title) {
                dataToUpdate.slug = await generateUniqueSlug(dataToUpdate.title);
                console.log(`Regenerated slug due to title change: ${dataToUpdate.slug}`);
            }
        } else if (dataToUpdate.slug) {
            const existingSlug = await prisma.course.findFirst({ where: { slug: dataToUpdate.slug, NOT: { id: courseId } } });
            if (existingSlug) {
                return res.status(409).json({ message: `Conflict: Slug "${dataToUpdate.slug}" is already in use by another course.` });
            }
        }
        // --- End Slug Handling ---

        // --- Category ID Handling ---
        if (dataToUpdate.categoryId !== undefined && dataToUpdate.categoryId !== null) {
            const parsedCategoryId = parseInt(dataToUpdate.categoryId, 10);
             if (isNaN(parsedCategoryId)) return res.status(400).json({ message: 'Invalid Category ID format provided.' });
            const categoryExists = await prisma.category.findUnique({ where: { id: parsedCategoryId } });
             if (!categoryExists) {
                 return res.status(400).json({ message: `Invalid input: Category with ID ${parsedCategoryId} not found.` });
             }
             dataToUpdate.categoryId = parsedCategoryId; // Ensure it's the parsed number
        } else if (dataToUpdate.categoryId === null) {
            // Allow explicitly setting category to null
            dataToUpdate.categoryId = null;
        }
        // --- End Category ID Handling ---

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No valid fields provided for update.' });
        }

        console.log(`Attempting to update course ${courseId} with data:`, dataToUpdate);

        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: dataToUpdate,
            include: {
                 instructor: { select: { id: true, name: true } },
                 category: { select: { id: true, name: true } },
            }
        });

        res.status(200).json({ message: 'Course updated successfully.', course: updatedCourse });

    } catch (error) {
        console.error(`Admin/Owner Error updating course ${courseId}:`, error);
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
            return res.status(409).json({ message: 'Conflict: The updated slug is already in use.' });
        }
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ message: `Course with ID ${courseId} not found.` });
        }
        if (error.code === 'P2003') { // Foreign Key constraint failed
             const constraint = error.meta?.constraint || 'unknown foreign key';
             console.error(`Foreign key constraint violation on update: ${constraint}`);
             return res.status(400).json({ message: `Invalid input: Referenced data not found (${constraint}). Check instructorId or categoryId.` });
         }
        next(error);
    }
};

/**
 * @description Delete a course
 * @route DELETE /api/admin/courses/:courseId
 * @access Private (Admin)
 */
export const adminDeleteCourse = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const courseId = parseInt(req.params.courseId, 10);
    // Admin role already checked by middleware

    try {
        console.log(`Admin attempting to delete course ${courseId}...`);
        // Prisma handles cascade deletes based on schema (e.g., Modules, Lessons)
        await prisma.course.delete({
            where: { id: courseId },
        });

        console.log(`Course ${courseId} deleted successfully.`);
        res.status(200).json({ message: `Course with ID ${courseId} deleted successfully.` });
        // Or use 204 No Content: res.status(204).send();

    } catch (error) {
        console.error(`Admin Error deleting course ${courseId}:`, error);
         if (error.code === 'P2025') { // Record to delete not found (might happen if deleted twice quickly)
            // Optionally, treat "not found" on delete as success (idempotent) or return 404
            return res.status(404).json({ message: `Course with ID ${courseId} not found.` });
            // return res.status(200).json({ message: `Course with ID ${courseId} already deleted or not found.` });
        }
        next(error);
    }
};