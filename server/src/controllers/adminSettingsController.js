// server/src/controllers/adminSettingsController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

// Define a list of known setting keys and their types/validation if needed
// This helps in validating and ensuring only allowed settings are updated.
const KNOWN_SETTINGS = {
  SITE_NAME: { type: 'string', isPublic: true, default: 'LMS Platform' },
  SUPPORT_EMAIL: { type: 'email', isPublic: true, default: 'support@example.com' },
  LOGO_URL: { type: 'url', isPublic: true, default: '/logo.png' },
  PRIMARY_COLOR: { type: 'hexcolor', isPublic: true, default: '#0056d2' },
  // For Razorpay keys, it's safer to manage them via .env variables.
  // If you must make them configurable via UI (use with extreme caution for secrets):
  // RAZORPAY_KEY_ID_TEST: { type: 'string', isPublic: false, sensitive: true },
  // RAZORPAY_PAYMENT_MODE: { type: 'enum', values: ['test', 'live'], isPublic: true, default: 'test' },
};


/**
 * @desc    Get all platform settings (or a subset for public view)
 * @route   GET /api/admin/platform-settings (for admin)
 * @route   GET /api/platform-settings/public (for public settings - NEW ROUTE NEEDED)
 * @access  Private (Admin) for all, Public for specific keys
 */
export const getPlatformSettings = async (req, res, next) => {
  try {
    // Determine if this is a request for public settings based on the route or a query param
    // For simplicity, let's assume an admin route gets all, and a separate public route gets public ones.
    // This controller function is for the ADMIN route, so it gets all.
    const isAdminRequest = req.path.startsWith('/api/admin'); // Simple check

    let settingsFromDb;
    if (isAdminRequest) {
      settingsFromDb = await prisma.platformSetting.findMany({
        orderBy: { key: 'asc' }
      });
    } else { // For a potential public endpoint
      settingsFromDb = await prisma.platformSetting.findMany({
        where: { isPublic: true },
        select: { key: true, value: true }, // Only key and value for public
        orderBy: { key: 'asc' }
      });
    }

    // Convert array of settings to a key-value object for easier frontend use
    const settingsObject = {};
    for (const setting of settingsFromDb) {
      // For admin, show all. For public, only isPublic=true settings were fetched.
      // Avoid showing sensitive values even to admin if they are write-only (e.g., API secrets)
      // This logic can be enhanced based on how 'sensitive' is marked in KNOWN_SETTINGS
      if (KNOWN_SETTINGS[setting.key]?.sensitive && isAdminRequest) {
        settingsObject[setting.key] = '********'; // Mask sensitive data even for admin GET
      } else {
        settingsObject[setting.key] = setting.value;
      }
    }

    // Ensure all known settings have a default value if not in DB
    if (isAdminRequest) {
        for (const key in KNOWN_SETTINGS) {
            if (!settingsObject.hasOwnProperty(key) && KNOWN_SETTINGS[key].default !== undefined) {
                settingsObject[key] = KNOWN_SETTINGS[key].default;
            }
        }
    }


    return res
      .status(200)
      .json(new ApiResponse(200, settingsObject, 'Platform settings fetched successfully.'));

  } catch (error) {
    console.error('Error fetching platform settings:', error);
    next(new ApiError(500, 'Failed to fetch platform settings.', [error.message]));
  }
};

/**
 * @desc    Update platform settings
 * @route   PUT /api/admin/platform-settings
 * @access  Private (Admin)
 * @body    An object where keys are setting names and values are the new setting values.
 * Example: { "SITE_NAME": "My Awesome LMS", "PRIMARY_COLOR": "#FF0000" }
 */
export const updatePlatformSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const settingsToUpdate = req.body; // e.g., { SITE_NAME: "New Name", PRIMARY_COLOR: "#aabbcc" }

  if (typeof settingsToUpdate !== 'object' || settingsToUpdate === null || Object.keys(settingsToUpdate).length === 0) {
    return next(new ApiError(400, 'No settings provided to update.'));
  }

  try {
    const updateOperations = [];
    const updatedKeys = [];

    for (const key in settingsToUpdate) {
      if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
        const value = settingsToUpdate[key];

        // Validate against KNOWN_SETTINGS if it exists
        if (!KNOWN_SETTINGS[key]) {
          console.warn(`Attempted to update unknown setting key: ${key}. Skipping.`);
          continue; // Skip unknown settings for security/stability
        }

        // Skip updating sensitive fields if they are placeholders (e.g. '********')
        if (KNOWN_SETTINGS[key].sensitive && value === '********') {
            console.log(`Skipping update for sensitive key ${key} as placeholder value was provided.`);
            continue;
        }


        // TODO: Add type validation based on KNOWN_SETTINGS[key].type
        // e.g., if (KNOWN_SETTINGS[key].type === 'hexcolor' && !/^#[0-9A-F]{6}$/i.test(value)) ... error

        updateOperations.push(
          prisma.platformSetting.upsert({
            where: { key: key },
            update: { value: value.toString(), isPublic: KNOWN_SETTINGS[key].isPublic }, // Ensure value is string
            create: {
              key: key,
              value: value.toString(),
              isPublic: KNOWN_SETTINGS[key].isPublic,
            },
          })
        );
        updatedKeys.push(key);
      }
    }

    if (updateOperations.length === 0) {
        return res.status(200).json(new ApiResponse(200, null, 'No valid settings provided for update or values were placeholders.'));
    }

    await prisma.$transaction(updateOperations);

    // Fetch the updated settings to return them
    const updatedSettingsFromDb = await prisma.platformSetting.findMany({
        where: { key: { in: updatedKeys } }
    });
    const updatedSettingsObject = {};
    updatedSettingsFromDb.forEach(setting => {
        if (KNOWN_SETTINGS[setting.key]?.sensitive) {
            updatedSettingsObject[setting.key] = '********';
        } else {
            updatedSettingsObject[setting.key] = setting.value;
        }
    });


    return res
      .status(200)
      .json(new ApiResponse(200, updatedSettingsObject, 'Platform settings updated successfully.'));

  } catch (error) {
    console.error('Error updating platform settings:', error);
    next(new ApiError(500, 'Failed to update platform settings.', [error.message]));
  }
};
