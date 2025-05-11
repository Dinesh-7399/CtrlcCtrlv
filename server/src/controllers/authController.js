// server/src/controllers/authController.js
import prisma from '../config/db.js'; // Prisma client
import { hashPassword, comparePassword } from '../utils/passwordHelper.js';
import { generateToken } from '../utils/jwtHelper.js'; // verifyToken is not used here
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ApiError(400, 'Validation failed', errorMessages));
  }

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new ApiError(409, 'User with this email already exists.'));
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STUDENT',
        profile: {
          create: {}, // Create an empty profile
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    const token = generateToken({ userId: newUser.id, role: newUser.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res
      .status(201)
      .json(new ApiResponse(201, { user: newUser }, 'User registered successfully.'));

  } catch (error) {
    console.error("[ERROR /api/auth/register]:", error);
    next(new ApiError(500, `User registration failed. ${error.message}`, [error.message]));
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ApiError(400, 'Validation failed', errorMessages));
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new ApiError(401, 'Invalid credentials. User not found.'));
    }

    if (user.status !== 'ACTIVE') {
      return next(new ApiError(403, 'Account is suspended. Please contact support.'));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials. Password incorrect.'));
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: userResponse }, 'Login successful.'));

  } catch (error) {
    console.error("[ERROR /api/auth/login]:", error);
    next(new ApiError(500, `Login failed. ${error.message}`, [error.message]));
  }
};

/**
 * @desc    Get current logged-in user details
 * @route   GET /api/auth/me
 * @access  Private (requires authMiddleware)
 */
export const getMe = async (req, res, next) => {
  // authMiddleware should have attached req.user
  if (!req.user || !req.user.userId) {
    // This case should ideally be caught by authMiddleware if token is truly missing or invalid early on.
    // If authMiddleware lets it through but req.user is still not populated, it's an issue.
    return next(new ApiError(401, 'Not authorized, user session is invalid or token data missing.'));
  }

  try {
    // Fetch user and their profile information
    const userWithProfile = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        // DO NOT select 'avatarUrl' directly from User model IF it's not defined there in schema.prisma
        profile: { // Select from the related UserProfile model
          select: {
            avatarUrl: true,
            headline: true,
            // Add other UserProfile fields you want to return here
            // bio: true,
            // websiteUrl: true,
            // socialLinks: true,
          }
        },
        // Include any other fields directly on the User model you need
        // e.g., createdAt, emailVerified, etc.
        createdAt: true,
      },
    });

    if (!userWithProfile) {
      // This can happen if the user was deleted after the token was issued
      res.clearCookie('token'); // Clear potentially invalid token
      return next(new ApiError(404, 'User not found.'));
    }
    
    // Construct a clean response object
    const responseUser = {
      id: userWithProfile.id,
      name: userWithProfile.name,
      email: userWithProfile.email,
      role: userWithProfile.role,
      status: userWithProfile.status,
      createdAt: userWithProfile.createdAt,
      avatarUrl: userWithProfile.profile?.avatarUrl || null, // Get avatarUrl from profile, fallback to null
      headline: userWithProfile.profile?.headline || null,
      // bio: userWithProfile.profile?.bio || null,
      // websiteUrl: userWithProfile.profile?.websiteUrl || null,
      // socialLinks: userWithProfile.profile?.socialLinks || null,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { user: responseUser }, 'User details fetched successfully.'));
  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error(`[ERROR /api/auth/me] Critical error fetching user details for userId ${req.user.userId}:`, error.name, error.message, error.stack);
    // Send a generic 500 error response to the client
    next(new ApiError(500, `Server error while fetching user details. Please try again later. Original error: ${error.message}`));
  }
};

/**
 * @desc    Log user out
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
  } catch (error) {
    console.error("[ERROR /api/auth/logout]:", error);
    next(new ApiError(500, `Logout failed. ${error.message}`, [error.message]));
  }
};

/**
 * @desc    Request password reset
 * @route   POST /api/auth/request-password-reset
 * @access  Public
 */
export const requestPasswordReset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json(new ApiResponse(200, null, 'If an account with this email exists, a password reset link has been sent.'));
    }
    // TODO: Implement actual token generation and email sending logic
    console.log(`TODO: Password reset requested for ${email}. Generate token and send email.`);
    return res.status(200).json(new ApiResponse(200, null, 'If an account with this email exists, a password reset link has been sent.'));
  } catch (error) {
    console.error("[ERROR /api/auth/request-password-reset]:", error);
    next(new ApiError(500, `Password reset request failed. ${error.message}`, [error.message]));
  }
};

/**
 * @desc    Reset password using a token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }
  const { token } = req.params;
  const { password } = req.body;
  try {
    // TODO: Implement actual token validation and password update logic
    console.log(`TODO: Password reset attempt with token ${token}. Validate token and update password.`);
    if (!token) return next(new ApiError(400, 'Invalid or missing reset token.'));
    // const hashedPassword = await hashPassword(password);
    // Find user by reset token, update password, invalidate token
    return res.status(200).json(new ApiResponse(200, null, 'Password has been reset successfully. You can now log in.'));
  } catch (error) {
    console.error("[ERROR /api/auth/reset-password/:token]:", error);
    next(new ApiError(500, `Password reset failed. ${error.message}`, [error.message]));
  }
};