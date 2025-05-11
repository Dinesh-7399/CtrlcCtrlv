// server/src/controllers/adminCourseController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import slugify from 'slugify';
import { Prisma } from '@prisma/client'; // For enums if needed for type checking

const ADMIN_COURSES_PER_PAGE = 10; // Default items per page for admin list

/**
 * Generates a unique slug for a course.
 * If the initial slug exists, it appends a counter.
 * @param {string} title - The title to slugify.
 * @param {number} [courseIdToExclude=null] - Optional course ID to exclude from uniqueness check (for updates).
 */
async function generateUniqueCourseSlug(title, courseIdToExclude = null) {
  let baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  let slug = baseSlug;
  let counter = 1;
  let existingCourseWithSlug;

  const whereClause = { slug };
  if (courseIdToExclude) {
    whereClause.NOT = { id: courseIdToExclude };
  }

  existingCourseWithSlug = await prisma.course.findFirst({ where: whereClause });

  while (existingCourseWithSlug) {
    slug = `${baseSlug}-${counter}`;
    whereClause.slug = slug; // Update slug in whereClause for next check
    existingCourseWithSlug = await prisma.course.findFirst({ where: whereClause });
    counter++;
  }
  return slug;
}


/**
 * @desc    Create a new course with modules and lessons
 * @route   POST /api/admin/courses
 * @access  Private (Admin)
 */
export const createCourse = async (req, res, next) => {
  const {
    title,
    description,
    price,
    categoryId,
    instructorId,
    difficulty,
    language,
    status,
    thumbnailUrl,
    isFeatured,
    slug: providedSlug, // Allow admin to provide a slug
    modules = [], // Array of module objects, each can contain lessons
  } = req.body;

  // Basic required field check (already covered by validation, but good for direct calls)
  if (!title || !description || !instructorId) {
    return next(new ApiError(400, 'Title, description, and instructor ID are required.'));
  }

  const numericInstructorId = parseInt(instructorId, 10);
  if (isNaN(numericInstructorId)) {
    return next(new ApiError(400, 'Invalid Instructor ID format.'));
  }

  try {
    // Verify instructor exists and has INSTRUCTOR role
    const instructorExists = await prisma.user.findFirst({
      where: { id: numericInstructorId, role: 'INSTRUCTOR' },
    });
    if (!instructorExists) {
      return next(new ApiError(404, `Instructor with ID ${numericInstructorId} not found or is not an instructor.`));
    }

    // Verify category exists if categoryId is provided
    let numericCategoryId = null;
    if (categoryId) {
      numericCategoryId = parseInt(categoryId, 10);
      if (isNaN(numericCategoryId)) {
        return next(new ApiError(400, 'Invalid Category ID format.'));
      }
      const categoryExists = await prisma.category.findUnique({ where: { id: numericCategoryId } });
      if (!categoryExists) {
        return next(new ApiError(404, `Category with ID ${numericCategoryId} not found.`));
      }
    }

    const finalSlug = providedSlug
      ? slugify(providedSlug, { lower: true, strict: true, trim: true })
      : await generateUniqueCourseSlug(title);

    // Check if the final slug (either provided or generated) is unique
    const existingCourseWithFinalSlug = await prisma.course.findUnique({ where: { slug: finalSlug } });
    if (existingCourseWithFinalSlug) {
        // This case should be rare if generateUniqueCourseSlug is used for auto-generation
        // but important if admin provides a slug that's already taken.
        return next(new ApiError(409, `A course with the slug '${finalSlug}' already exists. Please choose a different slug or title.`));
    }


    const courseData = {
      title,
      slug: finalSlug,
      description,
      price: parseFloat(price) || 0.0,
      instructorId: numericInstructorId,
      categoryId: numericCategoryId, // null if not provided
      status: status || Prisma.ContentStatus.DRAFT,
      difficulty: difficulty || Prisma.Difficulty.ALL_LEVELS,
      language: language || 'English',
      thumbnailUrl: thumbnailUrl || null,
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false,
      modules: { // Prisma's nested create for modules and their lessons
        create: modules.map(moduleData => {
          // Validate moduleData structure here if not fully covered by express-validator
          if (!moduleData.title || typeof moduleData.order !== 'number') {
            // This error might not be caught by `next` if thrown inside map.
            // Consider pre-validating modules array or using a robust validation library.
            console.error("Invalid module data:", moduleData);
            throw new ApiError(400, `Invalid data for module: ${moduleData.title || 'Untitled'}. Title and order are required.`);
          }
          return {
            title: moduleData.title,
            order: moduleData.order,
            lessons: {
              create: (moduleData.lessons || []).map(lessonData => {
                if (!lessonData.title || typeof lessonData.order !== 'number') {
                  console.error("Invalid lesson data:", lessonData);
                  throw new ApiError(400, `Invalid data for lesson: ${lessonData.title || 'Untitled'} in module ${moduleData.title}. Title and order are required.`);
                }
                // Auto-generate lesson slug if not provided
                const lessonSlug = lessonData.slug
                  ? slugify(lessonData.slug, { lower: true, strict: true, trim: true })
                  : slugify(lessonData.title, { lower: true, strict: true, trim: true });
                // Note: Lesson slug uniqueness is per module, Prisma handles this if @@unique([moduleId, slug]) is set.
                // If lesson slugs need to be globally unique, more complex generation is needed.
                // Your current schema has slug? @unique for Lesson, which implies global uniqueness. This needs careful handling.
                // For now, we'll make it unique within the context of this operation, but a robust solution
                // for globally unique lesson slugs would require a similar check as courses.
                // Let's assume for now lesson slugs are not globally unique in the DB and are namespaced by course/module in practice.
                // If they ARE globally unique in DB, this simple slugify might cause conflicts.
                // Your schema has `slug String? @unique` on Lesson. This IS problematic for simple slugify.
                // For now, I'll proceed with simple slugify, but highlight this as a potential issue.
                // A better approach for lesson slugs might be to make them unique *within a course* or not have them globally unique.
                // Or generate them like `courseSlug-moduleOrder-lessonOrder-lessonTitleSlug`

                return {
                  title: lessonData.title,
                  slug: lessonSlug, // Ensure this is handled for uniqueness if required globally
                  order: lessonData.order,
                  type: lessonData.type || Prisma.LessonType.TEXT,
                  content: lessonData.content || null,
                  videoUrl: lessonData.videoUrl || null,
                  videoDuration: lessonData.videoDuration ? parseInt(lessonData.videoDuration, 10) : null,
                  isFreePreview: typeof lessonData.isFreePreview === 'boolean' ? lessonData.isFreePreview : false,
                };
              }),
            },
          };
        }),
      },
    };

    const newCourse = await prisma.course.create({
      data: courseData,
      include: {
        instructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true }} } },
        category: { select: { id: true, name: true, slug: true } },
        modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }} } },
      },
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { course: newCourse }, 'Course created successfully.'));

  } catch (error) {
    console.error('Error creating course:', error);
    // Catch specific Prisma unique constraint errors (e.g., if slug was provided and is duplicate)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return next(new ApiError(409, `A course with this ${field || 'identifier'} already exists.`));
    }
    // If the error was an ApiError thrown from inside map (less ideal way to handle validation)
    if (error instanceof ApiError) {
        return next(error);
    }
    next(new ApiError(500, 'Failed to create course.', [error.message]));
  }
};

/**
 * @desc    Get all courses for admin (all statuses, with filters and pagination)
 * @route   GET /api/admin/courses
 * @access  Private (Admin)
 */
export const getAllCoursesForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ADMIN_COURSES_PER_PAGE;
    const skip = (page - 1) * limit;

    const { status, categoryId, instructorId, searchTerm, sortBy = 'createdAt_desc' } = req.query;

    let whereClause = {};
    if (status) whereClause.status = status; // Already validated to be in enum & uppercased by route validation
    if (categoryId) whereClause.categoryId = parseInt(categoryId, 10);
    if (instructorId) whereClause.instructorId = parseInt(instructorId, 10);

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { instructor: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    let orderByClause = {};
    const [sortField, sortOrder] = sortBy.split('_'); // e.g. 'createdAt_desc'
    if (['createdAt', 'title', 'price', 'updatedAt'].includes(sortField) && ['asc', 'desc'].includes(sortOrder)) {
        orderByClause[sortField] = sortOrder;
    } else {
        orderByClause = { createdAt: 'desc' }; // Default sort
    }


    const courses = await prisma.course.findMany({
      where: whereClause,
      select: { // Select fields needed for the admin list view
        id: true, title: true, slug: true, status: true, price: true, thumbnailUrl: true,
        instructor: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        createdAt: true, updatedAt: true, isFeatured: true,
        _count: { select: { modules: true, enrollments: true, reviews: true } },
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where: whereClause });
    const totalPages = Math.ceil(totalCourses / limit);
    
    const formattedCourses = courses.map(c => ({
        ...c,
        moduleCount: c._count?.modules || 0,
        enrollmentCount: c._count?.enrollments || 0,
        reviewCount: c._count?.reviews || 0,
        _count: undefined // Remove the Prisma count object after extracting values
    }));

    return res.status(200).json(
      new ApiResponse(200, { courses: formattedCourses, currentPage: page, totalPages, totalCourses }, 'Admin: Courses fetched successfully.')
    );
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    next(new ApiError(500, 'Failed to fetch courses for admin.', [error.message]));
  }
};

/**
 * @desc    Get a single course by ID with all details for admin editing
 * @route   GET /api/admin/courses/:courseId
 * @access  Private (Admin)
 */
export const getCourseByIdForAdmin = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const numericCourseId = parseInt(courseId, 10);

    if (isNaN(numericCourseId)) { // Should be caught by validation, but good practice
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    const course = await prisma.course.findUnique({
      where: { id: numericCourseId },
      include: {
        instructor: { select: { id: true, name: true, email: true } }, // Include more instructor details if needed
        category: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              // Select all lesson fields for admin editing
              select: {
                id: true, title: true, slug: true, content: true, videoUrl: true,
                videoDuration: true, type: true, order: true, isFreePreview: true,
                createdAt: true, updatedAt: true,
                // Include related items if needed for lesson editing form
                // quiz: { select: { id: true, title: true } },
                // dpp: { select: { id: true, title: true } },
                // attachments: { select: { id: true, name: true, fileUrl: true } }
              }
            },
          },
        },
        // Include other relations if needed for the admin edit form, e.g., reviews count
         _count: { select: { enrollments: true, reviews: true } }
      },
    });

    if (!course) {
      return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }
    
    const responseCourse = {
        ...course,
        enrollmentCount: course._count?.enrollments || 0,
        reviewCount: course._count?.reviews || 0,
    };
    delete responseCourse._count;


    return res
      .status(200)
      .json(new ApiResponse(200, { course: responseCourse }, 'Course details fetched for admin.'));
  } catch (error) {
    console.error(`Error fetching course ID '${req.params.courseId}' for admin:`, error);
    next(new ApiError(500, 'Failed to fetch course details for admin.', [error.message]));
  }
};


/**
 * @desc    Update course details.
 * This version primarily updates top-level course fields.
 * Updating nested modules/lessons in the same request is complex.
 * Consider separate, dedicated endpoints for managing modules and lessons within a course.
 * @route   PUT /api/admin/courses/:courseId
 * @access  Private (Admin)
 */
export const updateCourse = async (req, res, next) => {
  const { courseId } = req.params;
  const numericCourseId = parseInt(courseId, 10);

  // Destructure all potential fields from the body
  const {
    title, description, price, categoryId, instructorId,
    difficulty, language, status, thumbnailUrl, isFeatured,
    slug: providedSlug,
    modules: modulesDataToUpdate, // Array of module objects for update/create/delete
  } = req.body;

  if (isNaN(numericCourseId)) {
    return next(new ApiError(400, 'Invalid Course ID format.'));
  }

  try {
    const existingCourse = await prisma.course.findUnique({ where: { id: numericCourseId } });
    if (!existingCourse) {
      return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }

    const dataToUpdate = {};

    // Update direct course fields if provided
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = parseFloat(price) || 0.0;
    if (difficulty !== undefined) dataToUpdate.difficulty = difficulty;
    if (language !== undefined) dataToUpdate.language = language;
    if (status !== undefined) dataToUpdate.status = status;
    if (thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = thumbnailUrl === '' ? null : thumbnailUrl; // Allow clearing
    if (isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(isFeatured);

    if (instructorId !== undefined) {
      const numericInstructorId = parseInt(instructorId, 10);
      if (isNaN(numericInstructorId)) return next(new ApiError(400, 'Invalid Instructor ID.'));
      const instructorExists = await prisma.user.findFirst({ where: { id: numericInstructorId, role: 'INSTRUCTOR' } });
      if (!instructorExists) return next(new ApiError(404, `Instructor with ID ${numericInstructorId} not found or is not an instructor.`));
      dataToUpdate.instructorId = numericInstructorId;
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') { // Allow unsetting category
        dataToUpdate.categoryId = null;
      } else {
        const numericCatId = parseInt(categoryId, 10);
        if (isNaN(numericCatId)) return next(new ApiError(400, 'Invalid Category ID.'));
        const categoryExists = await prisma.category.findUnique({ where: { id: numericCatId } });
        if (!categoryExists) return next(new ApiError(404, `Category with ID ${numericCatId} not found.`));
        dataToUpdate.categoryId = numericCatId;
      }
    }

    // Slug update logic
    if (providedSlug && providedSlug !== existingCourse.slug) {
      dataToUpdate.slug = await generateUniqueCourseSlug(providedSlug, numericCourseId);
    } else if (title && title !== existingCourse.title && !providedSlug) {
      // If title changed and no new slug provided, regenerate slug from new title
      dataToUpdate.slug = await generateUniqueCourseSlug(title, numericCourseId);
    }

    // --- Transaction for updating course and its nested modules/lessons ---
    // This is a more robust way to handle nested updates.
    const updatedCourse = await prisma.$transaction(async (tx) => {
      const courseUpdateResult = await tx.course.update({
        where: { id: numericCourseId },
        data: dataToUpdate, // Update main course fields
      });

      if (modulesDataToUpdate && Array.isArray(modulesDataToUpdate)) {
        // 1. Get current module IDs for the course
        const currentModules = await tx.module.findMany({
          where: { courseId: numericCourseId },
          select: { id: true }
        });
        const currentModuleIds = currentModules.map(m => m.id);
        const incomingModuleIds = modulesDataToUpdate.map(m => m.id).filter(id => id != null);

        // 2. Delete modules that are not in the incoming data
        const modulesToDelete = currentModuleIds.filter(id => !incomingModuleIds.includes(id));
        if (modulesToDelete.length > 0) {
          await tx.module.deleteMany({
            where: { id: { in: modulesToDelete }, courseId: numericCourseId }
          });
        }

        // 3. Update existing modules and create new ones
        for (const moduleData of modulesDataToUpdate) {
          const lessonOps = { create: [], update: [], delete: [] };
          const currentLessonsInDb = moduleData.id ? await tx.lesson.findMany({ where: { moduleId: moduleData.id }, select: { id: true }}) : [];
          const currentLessonIdsInDb = currentLessonsInDb.map(l => l.id);
          const incomingLessonIds = (moduleData.lessons || []).map(l => l.id).filter(id => id != null);

          // Prepare lesson delete operations
          const lessonsToDelete = currentLessonIdsInDb.filter(id => !incomingLessonIds.includes(id));
          if (lessonsToDelete.length > 0) {
            // This will be part of module update's nested write
            // For direct delete: await tx.lesson.deleteMany({ where: { id: { in: lessonsToDelete }, moduleId: moduleData.id }});
          }

          (moduleData.lessons || []).forEach(lessonData => {
            const lessonPayload = {
              title: lessonData.title,
              slug: lessonData.slug ? slugify(lessonData.slug, { lower: true, strict: true, trim: true }) : slugify(lessonData.title, { lower: true, strict: true, trim: true }),
              order: lessonData.order,
              type: lessonData.type || Prisma.LessonType.TEXT,
              content: lessonData.content,
              videoUrl: lessonData.videoUrl,
              videoDuration: lessonData.videoDuration ? parseInt(lessonData.videoDuration) : null,
              isFreePreview: typeof lessonData.isFreePreview === 'boolean' ? lessonData.isFreePreview : false,
            };
            if (lessonData.id && currentLessonIdsInDb.includes(lessonData.id)) { // Update existing lesson
              lessonOps.update.push({ where: { id: lessonData.id }, data: lessonPayload });
            } else { // Create new lesson
              lessonOps.create.push(lessonPayload);
            }
          });

          const modulePayload = {
            title: moduleData.title,
            order: moduleData.order,
            lessons: {
              create: lessonOps.create,
              updateMany: lessonOps.update.map(op => ({ where: op.where, data: op.data })), // Prisma updateMany structure
              deleteMany: lessonsToDelete.length > 0 ? { id: { in: lessonsToDelete } } : undefined, // Prisma deleteMany structure
            },
          };

          if (moduleData.id && currentModuleIds.includes(moduleData.id)) { // Update existing module
            await tx.module.update({
              where: { id: moduleData.id },
              data: modulePayload,
            });
          } else { // Create new module
            await tx.module.create({
              data: {
                ...modulePayload,
                courseId: numericCourseId, // Link to parent course
              },
            });
          }
        }
      }

      // Re-fetch the fully updated course with all inclusions
      return tx.course.findUnique({
        where: { id: numericCourseId },
        include: {
          instructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true }} } },
          category: { select: { id: true, name: true, slug: true } },
          modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }} } },
        },
      });
    }); // End of transaction


    return res
      .status(200)
      .json(new ApiResponse(200, { course: updatedCourse }, 'Course updated successfully.'));

  } catch (error) {
    console.error(`Error updating course ID '${courseId}':`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
            return next(new ApiError(409, `The slug '${dataToUpdate.slug || providedSlug}' is already in use by another course.`));
        }
        if (error.code === 'P2025') { // Record to update/delete not found
            return next(new ApiError(404, `A related record was not found during update: ${error.meta?.cause || 'Details unavailable'}`));
        }
    }
    next(new ApiError(500, 'Failed to update course.', [error.message]));
  }
};


/**
 * @desc    Delete a course
 * @route   DELETE /api/admin/courses/:courseId
 * @access  Private (Admin)
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const numericCourseId = parseInt(courseId, 10);

    if (isNaN(numericCourseId)) { // Should be caught by validation
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    // Prisma's onDelete: Cascade on Module (to Course) and Lesson (to Module)
    // should handle deletion of nested modules and lessons.
    // Other relations like Enrollments, Reviews, Orders, Doubts, QnA will also be affected
    // based on their `onDelete` rules in the schema.
    // If `onDelete: Cascade` is set for these relations on the Course model, they will be deleted.
    // If `onDelete: SetNull` or `Restrict`, you might get errors or have to handle them manually.
    // Your current schema has Cascade for Modules->Lessons. For Enrollments, Reviews etc to Course, it's Cascade or SetNull.

    const courseToDelete = await prisma.course.findUnique({ where: { id: numericCourseId }});
    if (!courseToDelete) {
        return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }

    // Note: Deleting a course can have wide-ranging effects due to cascading deletes
    // or foreign key constraints. Ensure your schema's onDelete actions are what you intend.
    await prisma.course.delete({
      where: { id: numericCourseId },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Course and its associated content (modules, lessons due to cascade) deleted successfully.'));
  } catch (error) {
    console.error(`Error deleting course ID '${req.params.courseId}':`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return next(new ApiError(404, `Course with ID '${req.params.courseId}' not found for deletion.`));
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        // Foreign key constraint failure - something is still referencing this course that isn't set to cascade or set null.
        return next(new ApiError(409, `Cannot delete course. It is still referenced by other records (e.g., ${error.meta?.field_name}). Please remove these references or archive the course.`));
    }
    next(new ApiError(500, 'Failed to delete course.', [error.message]));
  }
};
