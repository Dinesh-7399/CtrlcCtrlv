// server/src/routes/upload.routes.js
import express from 'express';
// import { body } from 'express-validator'; // If you had other fields to validate along with file
import {
  upload, // This is the configured multer instance
  handleSingleFileUpload,
  handleMultipleFileUploads,
} from '../controllers/uploadController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
// import { handleValidationErrors } from '../middlewares/validationResultHandler.js'; // Only if using express-validator here

const router = express.Router();

// All upload routes should be protected
router.use(authMiddleware);

// --- Route Definitions ---

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single file. The field name in the form-data should be 'file'.
 * @access  Private (Authenticated Users)
 */
router.post(
  '/single',
  // 1. Multer middleware for single file upload.
  //    'file' is the name of the field in the form-data that contains the file.
  //    This middleware processes the file and attaches it to req.file.
  //    Any errors from multer (e.g., file size, file type from fileFilter)
  //    will be passed to the Express error handler (our global errorHandler).
  upload.single('file'),
  // 2. Controller function to handle the request after multer processing.
  handleSingleFileUpload
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload multiple files (e.g., up to 5). Field name 'files'.
 * @access  Private (Authenticated Users)
 */
router.post(
  '/multiple',
  // 1. Multer middleware for multiple file uploads.
  //    'files' is the field name. '5' is the maximum number of files allowed.
  upload.array('files', 5),
  // 2. Controller function.
  handleMultipleFileUploads
);

// You can add more specific upload routes if needed, for example:
// router.post('/avatar', upload.single('avatarImage'), handleAvatarUpload);
// router.post('/course-thumbnail', upload.single('courseThumbnail'), handleCourseThumbnailUpload);

export default router;
