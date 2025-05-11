// server/src/controllers/courseController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

const DEFAULT_COURSES_PER_PAGE = 9;

/**
 * @desc    Get all published courses with filtering, sorting, and pagination
 * @route   GET /api/courses
 * @access  Public
 */
export const getAllPublishedCourses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || DEFAULT_COURSES_PER_PAGE;
    const skip = (page - 1) * limit;

    const {
      category: categorySlug,
      searchTerm,
      difficulty,
      language,
      sortBy = 'createdAt_desc', // Default sort
    } = req.query;

    let whereClause = {
      status: 'PUBLISHED',
    };

    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (category) {
        whereClause.categoryId = category.id;
      } else {
        // If category slug is provided but not found, return no courses for that filter
        return res.status(200).json(
          new ApiResponse(200, { courses: [], currentPage: 1, totalPages: 0, totalCourses: 0, availableCategories: await prisma.category.findMany({select: {name: true, slug: true, id: true}}) }, 'No courses found for the specified category.')
        );
      }
    }

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { instructor: { name: { contains: searchTerm, mode: 'insensitive' } } },
        // Consider adding search by tags if you have a Tag model related to Course
      ];
    }

    if (difficulty) {
      whereClause.difficulty = difficulty; // Already validated and uppercased by route
    }

    if (language) {
      whereClause.language = { contains: language, mode: 'insensitive' };
    }

    let orderByClause = {};
    const [sortField, sortOrder] = sortBy.split('_');
     if (['createdAt', 'price', 'title', 'updatedAt'].includes(sortField) && ['asc', 'desc'].includes(sortOrder)) {
        if (sortField === 'title') { // Prisma specific for case-insensitive sort on text
            orderByClause = { [sortField]: { sort: sortOrder, mode: 'insensitive' } };
        } else {
            orderByClause = { [sortField]: sortOrder };
        }
    } else if (sortBy === 'rating_desc') {
        // Sorting by average rating is complex with Prisma directly in orderBy if it's not a stored field.
        // This would typically require a more complex query or a denormalized averageRating field on the Course model.
        // For now, defaulting to createdAt if 'rating_desc' is chosen but not implemented.
        console.warn("Sorting by 'rating_desc' is not fully implemented yet, defaulting to 'createdAt_desc'.");
        orderByClause = { createdAt: 'desc' };
    }
    else {
        orderByClause = { createdAt: 'desc' }; // Default sort
    }


    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, price: true,
        description: true, // For excerpt
        difficulty: true, language: true,
        instructor: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        // For displaying average rating and review count on list page
        reviews: { select: { rating: true } }, // Fetch ratings to calculate average
        _count: { select: { enrollments: true, reviews: true } },
      },
      orderBy: orderByClause,
      skip: skip,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where: whereClause });
    const totalPages = Math.ceil(totalCourses / limit);

    const formattedCourses = courses.map(course => {
      const totalReviews = course._count?.reviews || 0;
      const averageRating = totalReviews > 0
        ? parseFloat((course.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
        : 0;
      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        thumbnailUrl: course.thumbnailUrl,
        price: course.price,
        excerpt: course.description?.substring(0, 120) + (course.description?.length > 120 ? '...' : ''),
        difficulty: course.difficulty,
        language: course.language,
        instructor: {
          id: course.instructor.id,
          name: course.instructor.name,
          avatarUrl: course.instructor.profile?.avatarUrl || null,
        },
        category: course.category,
        createdAt: course.createdAt,
        averageRating: averageRating,
        reviewCount: totalReviews,
        enrollmentCount: course._count?.enrollments || 0,
      };
    });
    
    // Fetch all distinct categories that have published courses for filter options
    const distinctCategoryIdsWithCourses = await prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        distinct: ['categoryId'],
        select: { categoryId: true }
    });
    const categoryIds = distinctCategoryIdsWithCourses.map(c => c.categoryId).filter(id => id != null);
    
    const availableCategories = categoryIds.length > 0 ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
    }) : [];


    return res.status(200).json(
      new ApiResponse(
        200,
        {
          courses: formattedCourses,
          currentPage: page,
          totalPages,
          totalCourses,
          availableCategories, // Send available categories for filters
        },
        'Published courses fetched successfully.'
      )
    );
  } catch (error) {
    console.error('Error fetching published courses:', error);
    next(new ApiError(500, 'Failed to fetch courses.', [error.message]));
  }
};

/**
 * @desc    Get a single published course by its slug or ID.
 * Includes enrollment status if a user is authenticated.
 * @route   GET /api/courses/:identifier
 * @access  Public (enhanced if authenticated)
 */
export const getCourseBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const userId = req.user?.id; // From optional authMiddleware

    if (!identifier) {
      return next(new ApiError(400, 'Course slug or ID is required.'));
    }

    const isNumericId = /^\d+$/.test(identifier);
    const whereCondition = isNumericId
      ? { id: parseInt(identifier, 10), status: 'PUBLISHED' }
      : { slug: identifier, status: 'PUBLISHED' };

    const course = await prisma.course.findUnique({
      where: whereCondition,
      include: {
        instructor: {
          select: {
            id: true, name: true,
            profile: { select: { avatarUrl: true, headline: true, bio: true, socialLinks: true } },
          },
        },
        category: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true, title: true, order: true,
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true, title: true, slug: true, type: true,
                videoDuration: true, isFreePreview: true,
                // Content and videoUrl are NOT selected here for public view.
                // They are fetched by a protected lesson content endpoint.
              },
            },
          },
        },
        reviews: { // Fetch a sample of reviews or aggregate data
          select: { rating: true, comment: true, createdAt: true, user: { select: { name: true, profile: {select: {avatarUrl: true}} } } },
          orderBy: { createdAt: 'desc' },
          take: 5, // Example: take latest 5 reviews
        },
        _count: { select: { enrollments: true, reviews: true } },
        // Check if the current user (if any) is enrolled
        enrollments: userId ? { where: { userId: userId } } : false, // Include enrollments only if userId exists
      },
    });

    if (!course) {
      return next(new ApiError(404, `Course '${identifier}' not found or not published.`));
    }

    // Format the response
    const totalReviews = course._count?.reviews || 0;
    const averageRating = totalReviews > 0
      ? parseFloat((course.reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1))
      : 0;

    const responseCourse = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      price: course.price,
      status: course.status,
      difficulty: course.difficulty,
      language: course.language,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        avatarUrl: course.instructor.profile?.avatarUrl || null,
        headline: course.instructor.profile?.headline || null,
        bio: course.instructor.profile?.bio || null, // For instructor tab
        socialLinks: course.instructor.profile?.socialLinks || null,
      },
      category: course.category,
      modules: course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
            ...lesson,
            // Potentially add a 'path' or 'url' field for frontend routing to lesson
            // path: `/learn/${course.id}/${lesson.id}`
        }))
      })),
      reviews: course.reviews, // Already fetched sample
      enrollmentCount: course._count?.enrollments || 0,
      reviewCount: totalReviews,
      averageRating,
      isEnrolled: userId ? (course.enrollments && course.enrollments.length > 0) : false, // Check based on fetched enrollments for this user
    };
    // delete responseCourse._count; // Clean up Prisma's _count
    // delete responseCourse.enrollments; // Clean up raw enrollments data

    return res
      .status(200)
      .json(new ApiResponse(200, { course: responseCourse }, 'Course details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching course '${req.params.identifier}':`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2023')) { // Record not found or invalid ID format
        return next(new ApiError(404, `Course '${req.params.identifier}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch course details.', [error.message]));
  }
};
