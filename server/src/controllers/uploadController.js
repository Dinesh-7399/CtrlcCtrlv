// server/src/controllers/uploadController.js
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // File system module for creating directories
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { fileURLToPath } from 'url';

// --- Multer Configuration ---

// Define the destination directory for uploads
// Correctly get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url); // server/src/controllers/uploadController.js
const __dirname = path.dirname(__filename);         // server/src/controllers/
// Path to 'server/public/uploads/' from 'server/src/controllers/'
const UPLOAD_DIRECTORY = path.join(__dirname, '../../public/uploads');

// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIRECTORY)) {
  try {
    fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });
    console.log(`Upload directory created: ${UPLOAD_DIRECTORY}`);
  } catch (err) {
    console.error(`Error creating upload directory ${UPLOAD_DIRECTORY}:`, err);
    // Depending on your error handling strategy, you might want to throw or exit
  }
}


// Configure storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIRECTORY); // Save files to the 'public/uploads' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename: fieldname-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter to accept only certain types of files (customize as needed)
const fileFilter = (req, file, cb) => {
  // Example: Accept images, PDFs, and common document types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain',
    // Add more MIME types as needed for your LMS (e.g., for code files, zip)
    'application/zip',
    'application/x-rar-compressed', // .rar (less standard MIME type)
    'text/javascript', // .js
    'text/x-python', // .py
    // etc.
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new ApiError(400, 'Invalid file type. Only images, PDFs, documents, and specified code files are allowed.'), false); // Reject file
  }
};

// Initialize multer upload instance
// 'file' is the field name in the form-data request
const MAX_FILE_SIZE_MB = 10; // Set max file size (e.g., 10MB)
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, // Convert MB to bytes
  },
  fileFilter: fileFilter,
});
// Note: `upload.single('file')` or `upload.array('files', 5)` will be used as middleware in the route.

/**
 * @desc    Handle single file upload
 * @route   POST /api/upload/single (or just /api/upload if it's the only upload type)
 * @access  Private (Authenticated Users)
 * @field   'file' (name of the file input field in the form-data)
 */
export const handleSingleFileUpload = async (req, res, next) => {
  // If multer's fileFilter rejected the file, req.file might not be populated,
  // and an error might have already been passed to `next` by multer if `cb(error)` was used.
  // If `cb(null, false)` was used, req.file would be undefined.
  if (!req.file) {
    // This case might be hit if fileFilter passes `cb(null, false)` and no error is thrown by multer.
    // Or if the client didn't send a file with the expected field name.
    return next(new ApiError(400, 'No file uploaded or file rejected by filter. Please select a valid file.'));
  }

  try {
    // File has been successfully uploaded by multer middleware at this point.
    // req.file contains information about the uploaded file.
    const fileUrl = `/uploads/${req.file.filename}`; // Construct the URL to access the file

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          message: 'File uploaded successfully.',
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path, // Server path (for internal use, not typically sent to client)
          url: fileUrl,       // Publicly accessible URL
        },
        'File uploaded successfully.'
      )
    );
  } catch (error) {
    // This catch block is for unexpected errors after multer has processed the file.
    console.error('Error in handleSingleFileUpload controller:', error);
    next(new ApiError(500, 'File upload processing failed.', [error.message]));
  }
};

/**
 * @desc    Handle multiple file uploads (Example)
 * @route   POST /api/upload/multiple
 * @access  Private
 * @field   'files' (name of the file input field, expecting an array of files)
 */
export const handleMultipleFileUploads = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new ApiError(400, 'No files uploaded or files rejected by filter.'));
  }

  try {
    const uploadedFiles = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
    }));

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          message: `${uploadedFiles.length} file(s) uploaded successfully.`,
          files: uploadedFiles,
        },
        'Files uploaded successfully.'
      )
    );
  } catch (error) {
    console.error('Error in handleMultipleFileUploads controller:', error);
    next(new ApiError(500, 'Multiple file upload processing failed.', [error.message]));
  }
};

// Note: The actual multer middleware (e.g., upload.single('file'))
// will be applied in the route definition file (upload.routes.js).
// These controller functions are called *after* multer has processed the upload.
