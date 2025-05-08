// server/src/middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import prisma from '../config/db.js'; // Import Prisma Client

// --- Existing requireAuth (Keep as is) ---
export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("FATAL ERROR: JWT_SECRET is not defined.");
      return res.status(500).json({ message: 'Server configuration error.' });
    }
    const decodedPayload = jwt.verify(token, jwtSecret);
    if (!decodedPayload || !decodedPayload.user) {
        throw new Error('Invalid token payload structure');
    }
    req.user = decodedPayload.user; // Attach user info { id, role }
    next();
  } catch (error) {
    console.error('Authentication Error:', error.message);
    // Clear potentially invalid cookie
    res.clearCookie('token');
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Unauthorized: Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
    return res.status(401).json({ message: 'Unauthorized: Token verification failed.' });
  }
};

// --- NEW: Require Admin Middleware ---
export const requireAdmin = (req, res, next) => {
  // This middleware MUST run AFTER requireAuth
  if (!req.user) {
    // Should have been caught by requireAuth, but good failsafe
    return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admin access required.' }); // 403 Forbidden
  }

  // User is authenticated and is an Admin
  next();
};


// --- NEW: Require Admin or Instructor Owner Middleware ---
export const requireAdminOrInstructorOwner = async (req, res, next) => {
    // This middleware MUST run AFTER requireAuth
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: Authentication required.' });
    }

    // Admins have access
    if (req.user.role === 'ADMIN') {
        return next();
    }

    // If not Admin, check if they are an Instructor
    if (req.user.role !== 'INSTRUCTOR') {
        return res.status(403).json({ message: 'Forbidden: Admin or Instructor access required.' });
    }

    // User is an Instructor, now check if they own the course
    const courseIdParam = req.params.courseId || req.params.id || req.body.courseId; // Try finding courseId in params or body
    const userId = req.user.id;

    if (!courseIdParam) {
         // If courseId is not available in params/body, cannot verify ownership
        console.warn('Ownership check failed: Course ID not found in request params or body.');
         // Might be less secure, depends on use case. Could deny access.
         // Let's deny for now, as ownership check is the point.
         return res.status(400).json({ message: 'Bad Request: Course ID is required for ownership check.' });
         // Alternatively, allow if no courseId provided (e.g., listing *own* courses): next();
    }

    // Convert courseId to number if it looks numeric (Prisma needs correct type)
    const courseId = /^\d+$/.test(courseIdParam) ? parseInt(courseIdParam, 10) : null;

    if (courseId === null) {
         return res.status(400).json({ message: 'Bad Request: Invalid Course ID format.' });
    }


    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { instructorId: true } // Only need the instructorId to check ownership
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Check if the logged-in instructor owns the course
        if (course.instructorId === userId) {
            next(); // Authorized: User is the instructor who owns this course
        } else {
            res.status(403).json({ message: 'Forbidden: You do not own this course.' });
        }

    } catch (error) {
        console.error("Error checking course ownership:", error);
        next(error); // Pass to global error handler
    }
};