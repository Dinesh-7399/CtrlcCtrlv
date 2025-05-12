// server/src/controllers/authController.js
import prisma from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/passwordHelper.js';
import { generateToken } from '../utils/jwtHelper.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ApiError(400, 'Validation failed during registration.', errorMessages));
  }

  const { name, email, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ApiError(409, 'User with this email already exists.'));
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STUDENT', // Default role
        profile: {
          create: {}, // Automatically create an empty profile
        },
      },
      select: { // Select only necessary fields to return
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
        profile: { select: { avatarUrl: true, headline: true } } // Include basic profile info
      }
    });

    const token = generateToken({ userId: newUser.id, role: newUser.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Adjust sameSite for production if cross-site
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Prepare user object for response, similar to getMe
    const userResponse = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt,
        avatarUrl: newUser.profile?.avatarUrl || null,
        headline: newUser.profile?.headline || null,
    };

    return res.status(201).json(new ApiResponse(201, { user: userResponse }, 'User registered successfully.'));
  } catch (error) {
    console.error("[ERROR /api/auth/register]:", error.name, error.message, error.stack);
    if (error.code === 'P2002') { // Prisma unique constraint error
        return next(new ApiError(409, `Registration failed: A user with that ${error.meta?.target?.join(', ')} already exists.`));
    }
    next(new ApiError(500, `User registration failed due to a server error. ${error.message}`));
  }
};

export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return next(new ApiError(400, 'Validation failed during login.', errorMessages));
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: { select: { avatarUrl: true, headline: true } } } // Include profile for response
    });

    if (!user) {
      return next(new ApiError(401, 'Invalid credentials. User not found.'));
    }
    if (user.status !== 'ACTIVE') {
      return next(new ApiError(403, 'Your account is currently suspended. Please contact support.'));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials. Password incorrect.'));
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    const userResponse = {
      id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt,
      avatarUrl: user.profile?.avatarUrl || null,
      headline: user.profile?.headline || null,
    };

    return res.status(200).json(new ApiResponse(200, { user: userResponse }, 'Login successful.'));
  } catch (error) {
    console.error("[ERROR /api/auth/login]:", error.name, error.message, error.stack);
    next(new ApiError(500, `Login failed due to a server error. ${error.message}`));
  }
};

export const getMe = async (req, res, next) => {
  // req.user should be populated by authMiddleware if token is valid
  if (!req.user || !req.user.userId) {
    // This path indicates an issue with authMiddleware or token was cleared but endpoint accessed
    return next(new ApiError(401, 'Not authorized. No valid user session found.'));
  }

  try {
    const userWithProfile = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, role: true, status: true, createdAt: true,
        profile: {
          select: { avatarUrl: true, headline: true, bio: true, websiteUrl: true, socialLinks: true }
        }
      },
    });

    if (!userWithProfile) {
      // User existed when token was issued, but not anymore. Clear cookie.
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return next(new ApiError(404, 'User associated with this session not found. Please log in again.'));
    }
     if (userWithProfile.status !== 'ACTIVE') {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      return next(new ApiError(403, `Your account is ${userWithProfile.status.toLowerCase()}. Please contact support.`));
    }


    // Construct a clean response object
    const responseUser = {
      id: userWithProfile.id,
      name: userWithProfile.name,
      email: userWithProfile.email,
      role: userWithProfile.role,
      status: userWithProfile.status,
      createdAt: userWithProfile.createdAt,
      avatarUrl: userWithProfile.profile?.avatarUrl || null,
      headline: userWithProfile.profile?.headline || null,
      bio: userWithProfile.profile?.bio || null,
      websiteUrl: userWithProfile.profile?.websiteUrl || null,
      socialLinks: userWithProfile.profile?.socialLinks || null,
    };

    return res.status(200).json(new ApiResponse(200, { user: responseUser }, 'User details fetched successfully.'));
  } catch (error) {
    console.error(`[ERROR /api/auth/me] Error fetching details for userId ${req.user.userId}:`, error.name, error.message, error.stack);
    if (error.code === 'P2025') { // Prisma specific: Record not found
        res.clearCookie('token');
        return next(new ApiError(404, 'User data not found. Session may be invalid.'));
    }
    next(new ApiError(500, `Server error fetching user details. ${error.message}`));
  }
};

export const logoutUser = (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0), // Set to past date to expire immediately
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully.'));
  } catch (error) {
    console.error("[ERROR /api/auth/logout]:", error.name, error.message, error.stack);
    next(new ApiError(500, `Logout failed. ${error.message}`));
  }
};

export const requestPasswordReset = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // It's good practice not to reveal if an email exists or not for password resets
      return res.status(200).json(new ApiResponse(200, null, 'If an account with this email exists, a password reset link has been sent.'));
    }
    // TODO: Implement actual token generation (e.g., crypto random bytes, store hashed token with expiry in DB)
    // TODO: Implement email sending logic (e.g., nodemailer with a transactional email service)
    const resetToken = "dummy-reset-token-" + Date.now(); // Replace with real token logic
    console.log(`Password reset requested for ${email}. Token: ${resetToken}. (Email sending not implemented)`);
    // Example: await prisma.passwordResetToken.create({ data: { userId: user.id, token: hashedResetToken, expiresAt: ... } });

    return res.status(200).json(new ApiResponse(200, null, 'If an account with this email exists, a password reset link has been sent.'));
  } catch (error) {
    console.error("[ERROR /api/auth/request-password-reset]:", error.name, error.message, error.stack);
    next(new ApiError(500, `Password reset request failed. ${error.message}`));
  }
};

export const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }
  const { token } = req.params;
  const { password } = req.body;
  try {
    // TODO: Implement actual token validation (find token in DB, check expiry, ensure it's not used)
    console.log(`Password reset attempt with token ${token}. (Token validation and password update not fully implemented)`);
    if (!token) return next(new ApiError(400, 'Invalid or missing reset token.'));

    // Example:
    // const passwordResetRecord = await prisma.passwordResetToken.findUnique({ where: { token: hashedTokenFromParam }});
    // if (!passwordResetRecord || passwordResetRecord.expiresAt < new Date() || passwordResetRecord.used) {
    //    return next(new ApiError(400, 'Invalid or expired reset token.'));
    // }
    // const hashedPassword = await hashPassword(password);
    // await prisma.user.update({ where: { id: passwordResetRecord.userId }, data: { password: hashedPassword }});
    // await prisma.passwordResetToken.update({ where: { id: passwordResetRecord.id }, data: { used: true }});

    return res.status(200).json(new ApiResponse(200, null, 'Password has been reset successfully. You can now log in.'));
  } catch (error) {
    console.error("[ERROR /api/auth/reset-password/:token]:", error.name, error.message, error.stack);
    next(new ApiError(500, `Password reset failed. ${error.message}`));
  }
};