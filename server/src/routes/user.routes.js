// server/src/routes/user.routes.js

import { Router } from "express";
import { body, param, validationResult } from "express-validator"; // Import param for URL parameter validation
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getUserProfile,
  updateMySettings,
  getPublicUserProfile,
  getMyEnrollments, // <-- Import the new controller function
} from "../controllers/userController.js";

const router = Router();

// --- Validation Rules ---
const updateProfileValidationRules = [
  // ... (keep existing validation rules for PUT /me/settings) ...
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters if provided."),
  body("bio").optional().isString().withMessage("Bio must be text.").trim(),
  body("headline")
    .optional()
    .isString()
    .withMessage("Headline must be text.")
    .trim()
    .isLength({ max: 100 })
    .withMessage("Headline cannot exceed 100 characters."),
  body("avatarUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Avatar URL must be a valid URL."),
  body("websiteUrl")
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Website URL must be a valid URL."),
  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be provided as an object."),
];

const userIdParamValidation = [
  // Validate that the :userId parameter is a valid integer
  param("userId")
    .isInt({ gt: 0 })
    .withMessage("User ID must be a positive integer."),
];

// --- Routes ---

// GET /api/users/me (Get logged-in user's profile)
router.get("/me", requireAuth, getUserProfile);

// PUT /api/users/me/settings (Update logged-in user's profile/settings)
router.put(
  "/me/settings",
  requireAuth,
  updateProfileValidationRules,
  updateMySettings
);
router.get("/me/enrollments", requireAuth, getMyEnrollments);

// GET /api/users/:userId/profile (Get public profile for a specific user ID - requires login) <-- NEW ROUTE
router.get(
  "/:userId/profile", // Route parameter :userId
  requireAuth, // Ensure request user is logged in
  userIdParamValidation, // Validate the :userId parameter in the URL
  getPublicUserProfile // Controller function
);

export default router;
