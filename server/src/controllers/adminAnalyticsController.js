// server/src/controllers/adminAnalyticsController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
// import { validationResult } from 'express-validator'; // If you add query params for filtering dates

/**
 * @desc    Get key platform statistics for the admin analytics dashboard.
 * @route   GET /api/admin/analytics/stats
 * @access  Private (Admin)
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count();

    // 2. Total Courses (both published and draft)
    const totalCourses = await prisma.course.count();
    const publishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });

    // 3. Total Enrollments
    const totalEnrollments = await prisma.enrollment.count();

    // 4. Total Revenue (from completed orders)
    // This assumes your Order model has an 'amount' and 'status' (COMPLETED)
    const revenueData = await prisma.order.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'COMPLETED',
      },
    });
    const totalRevenue = revenueData._sum.amount || 0;

    // 5. Recently Registered Users (e.g., last 7 days) - Placeholder for more complex query
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    const recentUsersCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 6. Recently Created Courses (e.g., last 7 days)
    const recentCoursesCount = await prisma.course.count({
        where: {
            createdAt: {
                gte: sevenDaysAgo,
            }
        }
    });


    const stats = {
      totalUsers,
      totalCourses,
      publishedCourses,
      draftCourses: totalCourses - publishedCourses,
      totalEnrollments,
      totalRevenue,
      recentUsersCount, // Users registered in the last 7 days
      recentCoursesCount, // Courses created in the last 7 days
      // Add more stats as needed:
      // - Active students (e.g., logged in recently or active progress)
      // - Average course completion rate
      // - Most popular courses (by enrollment)
    };

    return res
      .status(200)
      .json(new ApiResponse(200, stats, 'Platform statistics fetched successfully.'));

  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    next(new ApiError(500, 'Failed to fetch platform statistics.', [error.message]));
  }
};

/**
 * @desc    Get data for user registration trends (e.g., monthly for the last year)
 * @route   GET /api/admin/analytics/user-trends
 * @access  Private (Admin)
 */
export const getUserRegistrationTrends = async (req, res, next) => {
  try {
    // Placeholder: In a real app, you would query user creation dates and aggregate by month/year.
    // Example: Group by month for the last 12 months.
    // This requires more complex date manipulation and grouping in Prisma or raw SQL.

    // For demonstration, returning mock data:
    const mockUserTrends = [
      { month: 'Jan', year: 2024, registrations: 50 },
      { month: 'Feb', year: 2024, registrations: 65 },
      { month: 'Mar', year: 2024, registrations: 80 },
      { month: 'Apr', year: 2024, registrations: 70 },
      { month: 'May', year: 2024, registrations: 90 },
      { month: 'Jun', year: 2024, registrations: 110 },
      // ... up to 12 months
    ];

    // Example of how you might start a Prisma query for this (incomplete):
    /*
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const userCountsByMonth = await prisma.user.groupBy({
      by: ['createdAt'], // This needs to be processed to group by month/year
      where: {
        createdAt: {
          gte: twelveMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      // orderBy: { createdAt: 'asc' }, // This also needs to be handled for month/year
    });
    // You would then need to process userCountsByMonth to format it as needed for charts.
    */

    return res
      .status(200)
      .json(new ApiResponse(200, { trends: mockUserTrends }, 'User registration trends fetched. (Mock Data)'));

  } catch (error) {
    console.error('Error fetching user registration trends:', error);
    next(new ApiError(500, 'Failed to fetch user registration trends.', [error.message]));
  }
};

/**
 * @desc    Get data for course enrollment overview (e.g., enrollments per category)
 * @route   GET /api/admin/analytics/enrollment-overview
 * @access  Private (Admin)
 */
export const getEnrollmentOverview = async (req, res, next) => {
  try {
    // Placeholder: Fetch enrollments grouped by course category.
    const enrollmentsByCategory = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            _count: {
                select: {
                    courses: { // Count courses within this category
                        where: { // that have enrollments
                            enrollments: { some: {} }
                        }
                    }
                }
            },
            // To get actual enrollment count per category, you'd need a more complex query
            // or iterate through courses and sum their enrollments.
            // This is a simplified example.
        },
        orderBy: {
            courses: { _count: 'desc' } // Order by number of courses (not enrollments directly here)
        }
    });

    // A more accurate way to get enrollments per category:
    const categoriesWithEnrollmentCounts = await prisma.category.findMany({
        include: {
            courses: {
                include: {
                    _count: {
                        select: { enrollments: true }
                    }
                }
            }
        }
    });

    const enrollmentOverview = categoriesWithEnrollmentCounts.map(category => {
        const totalEnrollmentsInCategory = category.courses.reduce((sum, course) => sum + (course._count?.enrollments || 0), 0);
        return {
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            totalEnrollments: totalEnrollmentsInCategory
        };
    }).sort((a,b) => b.totalEnrollments - a.totalEnrollments);


    return res
      .status(200)
      .json(new ApiResponse(200, { overview: enrollmentOverview }, 'Enrollment overview fetched.'));
  } catch (error) {
    console.error('Error fetching enrollment overview:', error);
    next(new ApiError(500, 'Failed to fetch enrollment overview.', [error.message]));
  }
};

// Add more analytics functions as needed (e.g., revenue trends, top courses by enrollment/revenue)
