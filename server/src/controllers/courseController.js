// server/src/controllers/courseController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
// Assuming Prisma is your ORM, if you have specific Prisma error types for more granular error handling:
import { Prisma } from '@prisma/client';


const DEFAULT_COURSES_PER_PAGE = 9;
const DEFAULT_REVIEWS_PER_PAGE = 5; // Default limit for reviews per page

/**
 * @desc    Get all published courses with filtering, sorting, and pagination
 * @route   GET /api/courses
 * @access  Public
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
      sortBy = 'createdAt_desc',
    } = req.query;

    let whereClause = {
      status: 'PUBLISHED',
    };

    if (categorySlug) {
      const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (category) {
        whereClause.categoryId = category.id;
      } else {
      const availableCategoriesData = await prisma.category.findMany({select: {name: true, slug: true, id: true}});
        return res.status(200).json(
          new ApiResponse(200, { courses: [], currentPage: 1, totalPages: 0, totalCourses: 0, availableCategories: availableCategoriesData }, 'No courses found for the specified category.')
        );
      }
    }

    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { instructor: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (difficulty) {
      whereClause.difficulty = difficulty;
    }

    if (language) {
      whereClause.language = { contains: language, mode: 'insensitive' };
    }

    let orderByClause = {};
    const [sortField, sortOrder] = sortBy.split('_');
    if (['createdAt', 'price', 'title', 'updatedAt'].includes(sortField) && ['asc', 'desc'].includes(sortOrder)) {
      if (sortField === 'title') {
        orderByClause = { [sortField]: { sort: sortOrder, mode: 'insensitive' } };
      } else {
        orderByClause = { [sortField]: sortOrder };
      }
    } else if (sortBy === 'rating_desc') {
      console.warn("Sorting by 'rating_desc' is not fully implemented yet for direct Prisma query, defaulting to 'createdAt_desc'. Consider denormalizing averageRating.");
      orderByClause = { createdAt: 'desc' };
    } else {
      orderByClause = { createdAt: 'desc' };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true, title: true, slug: true, thumbnailUrl: true, price: true,
        description: true, difficulty: true, language: true,
        instructor: {
          select: { id: true, name: true, profile: { select: { avatarUrl: true } } },
        },
        category: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        reviews: { select: { rating: true } }, // For average rating calculation
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
          availableCategories,
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
 * @desc    Get a single published course by its slug or ID.
 * @route   GET /api/courses/:identifier
 * @access  Public (enhanced if authenticated)
 */
export const getCourseBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const userId = req.user?.id;

    if (!identifier) {
      return next(new ApiError(400, 'Course slug or ID is required.'));
    }

    const isNumericId = /^\d+$/.test(identifier);
    // Ensure numeric IDs are parsed as integers for the Prisma query
    const courseIdAsInt = isNumericId ? parseInt(identifier, 10) : null;

    if (isNumericId && isNaN(courseIdAsInt)) {
        return next(new ApiError(400, 'Invalid numeric course ID.'));
    }

    const whereCondition = isNumericId
      ? { id: courseIdAsInt, status: 'PUBLISHED' }
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
              },
            },
          },
        },
        // For course detail, you might fetch all reviews' ratings to calculate average,
        // or rely on the dedicated reviews endpoint for paginated full reviews.
        // Here, we'll calculate average from a sample or all review ratings.
        reviews: { 
          select: { rating: true }, // Select only ratings for calculation
        },
        _count: { select: { enrollments: true, reviews: true } },
        enrollments: userId ? { where: { userId: userId }, select: { id: true } } : false,
      },
    });

    if (!course) {
      return next(new ApiError(404, `Course '${identifier}' not found or not published.`));
    }

    const totalReviewsCount = course._count?.reviews || 0;
    const sumOfRatings = course.reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRatingValue = totalReviewsCount > 0
      ? parseFloat((sumOfRatings / totalReviewsCount).toFixed(1))
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
      learningObjectives: course.learningObjectives, // Assuming this field exists
      prerequisites: course.prerequisites, // Assuming this field exists
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      instructor: {
        id: course.instructor.id,
        name: course.instructor.name,
        avatarUrl: course.instructor.profile?.avatarUrl || null,
        headline: course.instructor.profile?.headline || null,
        bio: course.instructor.profile?.bio || null,
        socialLinks: course.instructor.profile?.socialLinks || null,
      },
      category: course.category,
      modules: course.modules.map(module => ({
        ...module,
        lessons: module.lessons.map(lesson => ({
          ...lesson,
        }))
      })),
      // Note: Detailed paginated reviews should come from the /reviews endpoint.
      // The 'reviews' field here was used for average rating calculation.
      // To avoid confusion, don't send the raw 'course.reviews' sample to the client here
      // if they expect the full paginated list from the other endpoint.
      enrollmentCount: course._count?.enrollments || 0,
      reviewCount: totalReviewsCount,
      averageRating: averageRatingValue,
      isEnrolled: userId ? (course.enrollments && course.enrollments.length > 0) : false,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { course: responseCourse }, 'Course details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching course '${req.params.identifier}':`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2023')) {
      return next(new ApiError(404, `Course '${req.params.identifier}' not found.`));
    }
    next(new ApiError(500, 'Failed to fetch course details.', [error.message]));
  }
};


/**
 * @desc    Get all reviews for a specific course with pagination
 * @route   GET /api/courses/:courseId/reviews
 * @access  Public
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    // courseId is already validated and parsed toInt by express-validator
    const courseId = req.params.courseId; 
    const page = req.query.page || 1;
    const limit = req.query.limit || DEFAULT_REVIEWS_PER_PAGE;
    const skip = (page - 1) * limit;

    // 1. Check if the course exists and is published
    const course = await prisma.course.findUnique({
      where: { 
        id: courseId, // courseId is already an integer from validation
        status: 'PUBLISHED' 
      },
    });

    if (!course) {
      return next(new ApiError(404, `Published course with ID '${courseId}' not found.`));
    }

    // 2. Fetch reviews for the course
    const reviews = await prisma.review.findMany({
      where: {
        courseId: courseId,
        // You might want to add a status filter if reviews can be pending/approved
        // status: 'APPROVED', 
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { // Assuming a relation 'user' on the Review model
          select: {
            id: true,
            name: true,
            profile: { // Assuming a 'profile' relation on the User model
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest reviews first
      },
      skip: skip,
      take: limit,
    });

    // 3. Get total count of reviews for pagination
    const totalReviews = await prisma.review.count({
      where: {
        courseId: courseId,
        // status: 'APPROVED', // Match filter above if used
      },
    });

    const totalPages = Math.ceil(totalReviews / limit);

    // Format reviews to ensure consistent structure, e.g., for avatarUrl
    const formattedReviews = reviews.map(review => ({
      ...review,
      user: {
        id: review.user.id,
        name: review.user.name,
        // Ensure avatarUrl is null if profile or avatarUrl is missing
        avatarUrl: review.user.profile?.avatarUrl || null, 
      }
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews: formattedReviews,
          currentPage: page,
          totalPages,
          totalReviews,
          courseId: courseId, // Optionally return the courseId for context
        },
        'Course reviews fetched successfully.'
      )
    );
  } catch (error) {
    console.error(`Error fetching reviews for course '${req.params.courseId}':`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors, e.g., if ID format was somehow wrong despite validation
        return next(new ApiError(400, 'Invalid request for course reviews.', [error.message]));
    }
    next(new ApiError(500, 'Failed to fetch course reviews.', [error.message]));
  }
};