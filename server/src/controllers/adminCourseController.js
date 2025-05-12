// server/src/controllers/adminCourseController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import slugify from 'slugify';
// Import enums directly for use in controller logic if needed, though primarily for routes
import { ContentStatus, Difficulty, LessonType } from '@prisma/client';

const ADMIN_COURSES_PER_PAGE = 10;

// (generateUniqueCourseSlug function remains largely the same, ensure it correctly uses courseIdToExclude)
async function generateUniqueCourseSlug(title, courseIdToExclude = null) {
  let baseSlug = slugify(title, { lower: true, strict: true, trim: true });
  if (!baseSlug) { // Handle empty title case resulting in empty slug
    baseSlug = `course-${Date.now().toString().slice(-5)}`;
  }
  let slug = baseSlug;
  let counter = 1;
  let existingCourseWithSlug;

  const whereClause = { slug };
  if (courseIdToExclude) {
    whereClause.NOT = { id: Number(courseIdToExclude) };
  }

  existingCourseWithSlug = await prisma.course.findFirst({ where: whereClause });

  while (existingCourseWithSlug) {
    slug = `${baseSlug}-${counter}`;
    whereClause.slug = slug;
    existingCourseWithSlug = await prisma.course.findFirst({ where: whereClause });
    counter++;
  }
  return slug;
}


export const createCourse = async (req, res, next) => {
  const {
    title, description, price, categoryId, instructorId,
    difficulty, language, status, thumbnailUrl, isFeatured,
    slug: providedSlug, modules = [],
  } = req.body;

  const authorId = req.user.userId; // Assuming admin creating is the "author" here or just for tracking

  if (!title || !description || !instructorId) {
    return next(new ApiError(400, 'Title, description, and instructor ID are required.'));
  }
  const numericInstructorId = parseInt(instructorId, 10);
  if (isNaN(numericInstructorId)) {
    return next(new ApiError(400, 'Invalid Instructor ID format.'));
  }

  try {
    const instructorExists = await prisma.user.findFirst({
      where: { id: numericInstructorId, role: 'INSTRUCTOR' },
    });
    if (!instructorExists) {
      return next(new ApiError(404, `Instructor with ID ${numericInstructorId} not found or is not an instructor.`));
    }

    let numericCategoryId = null;
    if (categoryId) {
      numericCategoryId = parseInt(categoryId, 10);
      if (isNaN(numericCategoryId)) return next(new ApiError(400, 'Invalid Category ID format.'));
      const categoryExists = await prisma.category.findUnique({ where: { id: numericCategoryId } });
      if (!categoryExists) return next(new ApiError(404, `Category with ID ${numericCategoryId} not found.`));
    }

    let finalSlug = providedSlug
      ? slugify(providedSlug, { lower: true, strict: true, trim: true })
      : await generateUniqueCourseSlug(title); // This will ensure uniqueness

    // Double check if a user-provided slug is actually unique (generateUniqueCourseSlug would handle it if it was based on title)
    if (providedSlug) {
        const existingWithProvidedSlug = await prisma.course.findUnique({ where: { slug: finalSlug }});
        if (existingWithProvidedSlug) {
            // If it exists, we should make it unique or error. Let's try making it unique.
            finalSlug = await generateUniqueCourseSlug(finalSlug); // This will append counter if needed
        }
    }


    const courseData = {
      title, slug: finalSlug, description,
      price: parseFloat(price) || 0.0,
      instructorId: numericInstructorId,
      categoryId: numericCategoryId,
      status: status || ContentStatus.DRAFT,
      difficulty: difficulty || Difficulty.ALL_LEVELS,
      language: language || 'English',
      thumbnailUrl: thumbnailUrl || null,
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false,
      modules: {
        create: modules.map((moduleData, moduleIndex) => {
          if (!moduleData.title || typeof moduleData.order !== 'number') {
            // This error handling within map is tricky. Pre-validate or simplify.
            // For robustness, this validation should ideally happen before the transaction.
            // Throwing here might not be caught by the main try-catch and passed to `next` correctly.
            console.error("Invalid module data in createCourse:", moduleData);
            throw new Error(`Module at index ${moduleIndex} is missing title or order.`);
          }
          return {
            title: moduleData.title,
            order: moduleData.order,
            lessons: {
              create: (moduleData.lessons || []).map((lessonData, lessonIndex) => {
                 if (!lessonData.title || typeof lessonData.order !== 'number') {
                    console.error("Invalid lesson data in createCourse:", lessonData);
                    throw new Error(`Lesson at index ${lessonIndex} in module "${moduleData.title}" is missing title or order.`);
                 }
                // Lesson slugs: Assuming they are unique within a module, not globally.
                // If global uniqueness is required for lessons, a robust slug generation like for courses is needed.
                const lessonSlugBase = lessonData.slug || lessonData.title;
                const lessonSlug = slugify(lessonSlugBase, { lower: true, strict: true, trim: true }) || `lesson-${lessonIndex + 1}`;

                return {
                  title: lessonData.title,
                  slug: lessonSlug,
                  order: lessonData.order,
                  type: lessonData.type || LessonType.TEXT,
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

    return res.status(201).json(new ApiResponse(201, { course: newCourse }, 'Course created successfully.'));
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return next(new ApiError(409, `A course with this ${field || 'identifier'} already exists.`));
    }
    next(new ApiError(500, 'Failed to create course.', [error.message]));
  }
};

export const updateCourse = async (req, res, next) => {
  const { courseId } = req.params;
  const numericCourseId = parseInt(courseId, 10);

  const {
    title, description, price, categoryId, instructorId,
    difficulty, language, status, thumbnailUrl, isFeatured,
    slug: providedSlug,
    modules: modulesDataToUpdate,
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
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description.trim();
    if (price !== undefined) dataToUpdate.price = parseFloat(price) || 0.0;
    if (difficulty !== undefined) dataToUpdate.difficulty = difficulty;
    if (language !== undefined) dataToUpdate.language = language.trim();
    if (status !== undefined) dataToUpdate.status = status;
    if (thumbnailUrl !== undefined) dataToUpdate.thumbnailUrl = thumbnailUrl.trim() === '' ? null : thumbnailUrl.trim();
    if (isFeatured !== undefined) dataToUpdate.isFeatured = Boolean(isFeatured);

    if (instructorId !== undefined) {
      const numInstructorId = parseInt(instructorId, 10);
      if (isNaN(numInstructorId)) return next(new ApiError(400, 'Invalid Instructor ID.'));
      const instructor = await prisma.user.findFirst({ where: { id: numInstructorId, role: 'INSTRUCTOR' } });
      if (!instructor) return next(new ApiError(404, `Instructor with ID ${numInstructorId} not found or is not an instructor.`));
      dataToUpdate.instructorId = numInstructorId;
    }

    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '' || categoryId === 0) { // Ensure 0 is treated as unsetting if that's the UI logic
        dataToUpdate.categoryId = null;
      } else {
        const numCatId = parseInt(categoryId, 10);
        if (isNaN(numCatId)) return next(new ApiError(400, 'Invalid Category ID.'));
        const category = await prisma.category.findUnique({ where: { id: numCatId } });
        if (!category) return next(new ApiError(404, `Category with ID ${numCatId} not found.`));
        dataToUpdate.categoryId = numCatId;
      }
    }

    if (providedSlug && providedSlug.trim() !== existingCourse.slug) {
      dataToUpdate.slug = await generateUniqueCourseSlug(providedSlug.trim(), numericCourseId);
    } else if (title && title.trim() !== existingCourse.title && !providedSlug) {
      dataToUpdate.slug = await generateUniqueCourseSlug(title.trim(), numericCourseId);
    }

    const updatedCourse = await prisma.$transaction(async (tx) => {
      const courseUpdateResult = await tx.course.update({
        where: { id: numericCourseId },
        data: dataToUpdate,
      });

      if (modulesDataToUpdate && Array.isArray(modulesDataToUpdate)) {
        const currentDbModules = await tx.module.findMany({
            where: { courseId: numericCourseId },
            select: { id: true, lessons: { select: { id: true } } }
        });
        const currentDbModuleIds = currentDbModules.map(m => m.id);
        const incomingClientModuleIds = modulesDataToUpdate.map(m => m.id).filter(id => typeof id === 'number');

        // Delete modules not in incoming data
        const moduleIdsToDelete = currentDbModuleIds.filter(id => !incomingClientModuleIds.includes(id));
        if (moduleIdsToDelete.length > 0) {
            // Deleting modules will cascade to delete their lessons due to schema relations
            await tx.module.deleteMany({ where: { id: { in: moduleIdsToDelete } } });
        }

        for (const [moduleIndex, moduleData] of modulesDataToUpdate.entries()) {
            const modulePayload = {
                title: moduleData.title.trim(),
                order: moduleData.order !== undefined ? moduleData.order : moduleIndex, // Use provided order or index
                courseId: numericCourseId,
            };

            const lessonsToCreate = [];
            const lessonsToUpdate = [];
            const lessonIdsFromClientForThisModule = [];

            (moduleData.lessons || []).forEach((lessonData, lessonIndex) => {
                const lessonClientSideId = lessonData.id; // This could be DB ID or a temp client ID
                if(typeof lessonClientSideId === 'number') lessonIdsFromClientForThisModule.push(lessonClientSideId);

                const lessonDbPayload = {
                    title: lessonData.title.trim(),
                    slug: slugify(lessonData.slug || lessonData.title, { lower: true, strict: true, trim: true }) || `lesson-${lessonIndex + 1}-${Date.now().toString().slice(-3)}`,
                    order: lessonData.order !== undefined ? lessonData.order : lessonIndex,
                    type: lessonData.type || LessonType.TEXT,
                    content: lessonData.content || null,
                    videoUrl: lessonData.videoUrl || null,
                    videoDuration: lessonData.videoDuration ? parseInt(lessonData.videoDuration) : null,
                    isFreePreview: typeof lessonData.isFreePreview === 'boolean' ? lessonData.isFreePreview : false,
                };

                if (typeof lessonClientSideId === 'number') { // Existing lesson, prepare for update
                    lessonsToUpdate.push({ where: { id: lessonClientSideId }, data: lessonDbPayload });
                } else { // New lesson, prepare for create
                    lessonsToCreate.push(lessonDbPayload);
                }
            });

            let currentModuleInDb;
            if (typeof moduleData.id === 'number') { // Existing Module
                currentModuleInDb = currentDbModules.find(m => m.id === moduleData.id);
                
                const lessonIdsInDbForThisModule = currentModuleInDb ? currentModuleInDb.lessons.map(l => l.id) : [];
                const lessonIdsToDelete = lessonIdsInDbForThisModule.filter(id => !lessonIdsFromClientForThisModule.includes(id));

                await tx.module.update({
                    where: { id: moduleData.id },
                    data: {
                        ...modulePayload,
                        lessons: {
                            ...(lessonsToCreate.length > 0 && { create: lessonsToCreate }),
                            ...(lessonsToUpdate.length > 0 && { update: lessonsToUpdate }),
                            ...(lessonIdsToDelete.length > 0 && { deleteMany: { id: { in: lessonIdsToDelete } } }),
                        }
                    },
                });
            } else { // New Module
                await tx.module.create({
                    data: {
                        ...modulePayload,
                        lessons: { create: lessonsToCreate },
                    },
                });
            }
        }
      }
      // Re-fetch the fully updated course
      return tx.course.findUnique({
        where: { id: numericCourseId },
        include: {
          instructor: { select: { id: true, name: true, profile: { select: { avatarUrl: true }} } },
          category: { select: { id: true, name: true, slug: true } },
          modules: { orderBy: { order: 'asc' }, include: { lessons: { orderBy: { order: 'asc' }} } },
        },
      });
    });

    return res.status(200).json(new ApiResponse(200, { course: updatedCourse }, 'Course updated successfully.'));
  } catch (error) {
    console.error(`Error updating course ID '${courseId}':`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
      return next(new ApiError(409, `The slug '${dataToUpdate.slug || providedSlug}' is already in use.`));
    }
    if (error.code === 'P2025') {
        return next(new ApiError(404, `One or more records to update were not found: ${error.meta?.cause || 'Details unavailable'}`));
    }
    next(new ApiError(500, 'Failed to update course.', [error.message]));
  }
};

// getAllCoursesForAdmin and deleteCourse remain largely the same but ensure Prisma errors are handled.
export const getAllCoursesForAdmin = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || ADMIN_COURSES_PER_PAGE;
    const skip = (page - 1) * limit;

    const { status, categoryId, instructorId, searchTerm, sortBy = 'createdAt_desc' } = req.query;

    let whereClause = {};
    if (status) whereClause.status = status;
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
    const [sortField, sortOrder] = sortBy.split('_');
    if (['createdAt', 'title', 'price', 'updatedAt'].includes(sortField) && ['asc', 'desc'].includes(sortOrder)) {
        orderByClause[sortField] = sortOrder;
    } else {
        orderByClause = { createdAt: 'desc' };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
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
        _count: undefined,
    }));

    return res.status(200).json(
      new ApiResponse(200, { courses: formattedCourses, currentPage: page, totalPages, totalCourses }, 'Admin: Courses fetched successfully.')
    );
  } catch (error) {
    console.error('Error fetching courses for admin:', error);
    next(new ApiError(500, 'Failed to fetch courses for admin.', [error.message]));
  }
};

export const getCourseByIdForAdmin = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const numericCourseId = parseInt(courseId, 10);

    if (isNaN(numericCourseId)) {
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    const course = await prisma.course.findUnique({
      where: { id: numericCourseId },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, slug: true, content: true, videoUrl: true,
                videoDuration: true, type: true, order: true, isFreePreview: true,
                createdAt: true, updatedAt: true,
              }
            },
          },
        },
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


export const deleteCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const numericCourseId = parseInt(courseId, 10);

    if (isNaN(numericCourseId)) {
      return next(new ApiError(400, 'Invalid Course ID format.'));
    }
    const courseToDelete = await prisma.course.findUnique({ where: { id: numericCourseId }});
    if (!courseToDelete) {
        return next(new ApiError(404, `Course with ID ${numericCourseId} not found.`));
    }
    await prisma.course.delete({ where: { id: numericCourseId } });
    return res.status(200).json(new ApiResponse(200, null, 'Course deleted successfully.'));
  } catch (error) {
    console.error(`Error deleting course ID '${req.params.courseId}':`, error);
    if (error.code === 'P2025') {
        return next(new ApiError(404, `Course with ID '${req.params.courseId}' not found for deletion.`));
    }
    if (error.code === 'P2003') { // Foreign key constraint, though cascade should handle most
        return next(new ApiError(409, `Cannot delete course. It is still referenced by other records (e.g., ${error.meta?.field_name}). Please remove these references or archive the course.`));
    }
    next(new ApiError(500, 'Failed to delete course.', [error.message]));
  }
};