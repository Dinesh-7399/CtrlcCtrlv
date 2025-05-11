// src/controllers/platformController.js
import prisma from '../config/db.js';
import ApiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

export const getPublicPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalPublishedCourses = await prisma.course.count({ where: { status: 'PUBLISHED' } });
    // Add other relevant public stats
    const stats = { totalUsers, totalPublishedCourses };
    res.status(200).json(new ApiResponse(200, stats, 'Public platform stats fetched.'));
  } catch (error) {
    next(new ApiError(500, 'Failed to fetch public platform stats.'));
  }
};