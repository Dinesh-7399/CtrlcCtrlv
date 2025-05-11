// server/src/routes/adminSettings.routes.js
import express from 'express';
import { body } from 'express-validator';
import {
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/adminSettingsController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js'; // Ensure this path is correct

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

// For PUT, we expect a JSON object in the body.
// Specific validation for each setting key/value pair is best handled within the controller
// against the KNOWN_SETTINGS definition, as the keys in req.body are dynamic.
const updateSettingsValidation = [
  body()
    .isObject().withMessage('Request body must be an object of settings.')
    .custom(value => {
      if (Object.keys(value).length === 0) {
        throw new Error('Request body cannot be an empty object; at least one setting must be provided for update.');
      }
      // Further validation can check if all keys in 'value' are part of KNOWN_SETTINGS
      // and if their values match expected types, but this is more complex here
      // and is partially handled in the controller.
      return true;
    }),
];


// --- Route Definitions ---

/**
 * @route   GET /api/admin/platform-settings
 * @desc    Admin: Get all platform settings
 * @access  Private (Admin)
 */
router.get(
  '/',
  // No specific query validation needed for fetching all settings by admin
  getPlatformSettings
);

/**
 * @route   PUT /api/admin/platform-settings
 * @desc    Admin: Update platform settings
 * @access  Private (Admin)
 * @body    An object where keys are setting names and values are the new setting values.
 * Example: { "SITE_NAME": "My Awesome LMS", "PRIMARY_COLOR": "#FF0000" }
 */
router.put(
  '/',
  updateSettingsValidation,
  handleValidationErrors,
  updatePlatformSettings
);

// --- Public Route for Settings (Optional - if you need to expose some settings publicly) ---
// This would typically be a separate router file or a specific controller.
// For now, keeping admin settings distinct.
// Example:
// import { getPublicPlatformSettings } from '../controllers/platformSettingsController.js'; // A new controller
// router.get('/public', getPublicPlatformSettings); // Mounted under /api/platform-settings in server.js

export default router;
