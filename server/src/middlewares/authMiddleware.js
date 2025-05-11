// server/src/middlewares/authMiddleware.js
import { verifyToken } from '../utils/jwtHelper.js'; // Your JWT verification utility
import ApiError from '../utils/apiError.js';      // Your custom ApiError class
import prisma from '../config/db.js';           // Prisma client to fetch user details

/**
 * Middleware to protect routes that require authentication.
 * It can be configured to be optional.
 * If valid, it attaches user information (id, role, status) to req.user.
 * If invalid or missing and not optional, it sends a 401 Unauthorized error.
 * If invalid or missing but optional, it sets req.user to null and proceeds.
 *
 * @param {boolean} [isOptional=false] - If true, authentication is optional.
 * If token is missing/invalid, req.user will be null and next() called.
 * If false, token is required.
 * @returns {Function} Express middleware function.
 */
export const authMiddleware = (isOptional = false) => {
  return async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
      if (isOptional) {
        req.user = null; // No user, but it's optional, so proceed
        return next();
      }
      return next(new ApiError(401, 'Not authorized, no token provided. Please log in.'));
    }

    try {
      const decodedPayload = verifyToken(token);

      if (!decodedPayload || !decodedPayload.userId) {
        // Clear cookie if token is invalid
        res.clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Adjusted for production
        });
        if (isOptional) {
          req.user = null;
          return next();
        }
        return next(new ApiError(401, 'Not authorized, token is invalid or malformed.'));
      }

      const user = await prisma.user.findUnique({
        where: { id: decodedPayload.userId },
        select: { id: true, role: true, status: true }, // Select necessary fields
      });

      if (!user) {
        res.clearCookie('token');
        if (isOptional) {
          req.user = null;
          return next();
        }
        return next(new ApiError(401, 'Not authorized, user associated with token not found.'));
      }

      if (user.status !== 'ACTIVE') {
        res.clearCookie('token');
        if (isOptional) {
          // Even if optional, an inactive/suspended user probably shouldn't proceed as "authenticated"
          // but for consistency of req.user being null if auth fails in optional mode:
          req.user = null; 
          // Or, you might choose to still block here even if optional:
          // return next(new ApiError(403, `Access forbidden. Your account is ${user.status.toLowerCase()}.`));
          return next(); 
        }
        return next(new ApiError(403, `Access forbidden. Your account is ${user.status.toLowerCase()}.`));
      }

      // Attach user information to the request object
      req.user = {
        id: user.id, // Changed from userId to id to match prisma schema more directly
        role: user.role,
        status: user.status,
      };

      next();

    } catch (error) {
      // This catch block is for unexpected errors (e.g., database error, jwt internal error)
      console.error('Critical Error in authMiddleware:', error);
      
      // Clear potentially problematic cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      if (isOptional) {
        req.user = null;
        return next(); // Proceed without user if optional, even on unexpected error
      }

      if (!(error instanceof ApiError)) {
        return next(new ApiError(500, 'Authentication process encountered an unexpected issue.', [error.message]));
      }
      next(error); // Forward existing ApiError
    }
  };
};

/**
 * Middleware to authorize users based on roles.
 * This should be used AFTER authMiddleware (the non-optional version usually).
 * @param {Array<string>} allowedRoles - An array of roles that are allowed to access the route (e.g., ['ADMIN', 'INSTRUCTOR']).
 * @returns {Function} Express middleware function.
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This implies authMiddleware should have run and set req.user or failed
      return next(new ApiError(401, 'Not authorized. Authentication required for role check.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403, // Forbidden
          `Access denied. Your role (${req.user.role}) is not authorized to access this resource.`
        )
      );
    }
    next();
  };
};

// Specific role middlewares
// These use the non-optional version of authMiddleware implicitly by being placed after it in route definitions.
// If you need a middleware that is *just* for role check without re-doing auth,
// ensure authMiddleware has already run.
export const adminMiddleware = authorizeRoles(['ADMIN']);
export const instructorMiddleware = authorizeRoles(['INSTRUCTOR', 'ADMIN']); // Admin can also do instructor actions
export const studentMiddleware = authorizeRoles(['STUDENT', 'INSTRUCTOR', 'ADMIN']); // Everyone can do student actions if authenticated

// Example of a fully protected route chain:
// router.get('/some-admin-route', authMiddleware(), adminMiddleware, someController);
// Example of an optional auth route:
// router.get('/public-info-enhanced-if-logged-in', authMiddleware(true), someController);
