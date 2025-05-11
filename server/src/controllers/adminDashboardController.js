// server/src/controllers/adminDashboardController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get overview statistics for the admin dashboard
 * @route   GET /api/admin/dashboard/stats (or just /api/admin/dashboard/)
 * @access  Private (Admin)
 */
export const getDashboardOverviewStats = async (req, res, next) => {
  try {
    // 1. Total Users
    const totalUsers = await prisma.user.count();

    // 2. Total Published Courses
    const totalPublishedCourses = await prisma.course.count({
      where: { status: 'PUBLISHED' },
    });

    // 3. Total Active Enrollments (Count of unique users with at least one enrollment)
    // This can be interpreted in a few ways. For simplicity, let's count total enrollment records.
    // A more complex query might count unique users with active progress.
    const totalEnrollments = await prisma.enrollment.count();

    // 4. Recent Revenue (e.g., last 30 days from completed orders)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRevenueData = await prisma.order.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });
    const recentRevenue = recentRevenueData._sum.amount || 0;

    // 5. New User Registrations (e.g., last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await prisma.user.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 6. Open Doubts/Questions
    const openDoubtsCount = await prisma.doubt.count({
      where: {
        status: 'OPEN',
      },
    });

    // 7. Recently Created Articles (e.g., last 7 days, published or draft)
    const recentArticlesCount = await prisma.article.count({
        where: {
            createdAt: {
                gte: sevenDaysAgo,
            }
        }
    });


    const dashboardStats = {
      totalUsers,
      totalPublishedCourses,
      totalEnrollments,
      recentRevenue, // Revenue in the last 30 days
      newUsersLast7Days,
      openDoubtsCount,
      recentArticlesCount, // Articles created in the last 7 days
      // You can add more specific stats here as needed for the dashboard:
      // - Number of active instructors
      // - Number of pending course reviews (if you implement review moderation)
      // - Number of new enrollments today/this week
    };

    return res
      .status(200)
      .json(new ApiResponse(200, dashboardStats, 'Dashboard overview statistics fetched successfully.'));

  } catch (error) {
    console.error('Error fetching dashboard overview statistics:', error);
    next(new ApiError(500, 'Failed to fetch dashboard statistics.', [error.message]));
  }
};

// You might add other functions here if your dashboard has more distinct data needs,
// for example, fetching a list of the 5 most recent enrollments or 5 newest users.
// For now, one main stats endpoint is common for dashboards.
