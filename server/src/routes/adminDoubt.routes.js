// server/src/routes/adminDoubt.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
// Import enums directly
import { DoubtStatus } from '@prisma/client';
import {
  getAllDoubtsForAdmin,
  getDoubtByIdForAdmin,
  updateDoubtStatusByAdmin,
  assignInstructorToDoubtByAdmin,
  deleteDoubtMessageByAdmin,
  deleteDoubtThreadByAdmin,
} from '../controllers/adminDoubtController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();
router.use(authMiddleware(), adminMiddleware);

// --- Validation Rules ---
const doubtIdValidation = [ /* ... as before ... */ ];
const messageIdValidation = [ /* ... as before ... */ ];
const updateStatusValidation = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .custom((value) => {
      if (!DoubtStatus) throw new Error('Server Error: DoubtStatus enum not available.');
      if (!Object.values(DoubtStatus).includes(value)) throw new Error(`Invalid status. Must be one of: ${Object.values(DoubtStatus).join(', ')}`);
      return true;
    }),
];
const assignInstructorValidation = [ /* ... as before ... */ ];
const getAllDoubtsAdminValidation = [
    // ... (other query validations)
    query('status').optional().custom((value) => {
        if (!DoubtStatus) throw new Error('Server Error: DoubtStatus enum not available.');
        if (!Object.values(DoubtStatus).includes(value)) throw new Error('Invalid status filter.');
        return true;
    }),
    // ...
];

// --- Route Definitions ---
router.get('/', ...getAllDoubtsAdminValidation, handleValidationErrors, getAllDoubtsForAdmin);
router.get('/:doubtId', ...doubtIdValidation, handleValidationErrors, getDoubtByIdForAdmin);
router.put('/:doubtId/status', ...doubtIdValidation, ...updateStatusValidation, handleValidationErrors, updateDoubtStatusByAdmin);
router.put('/:doubtId/assign', ...doubtIdValidation, ...assignInstructorValidation, handleValidationErrors, assignInstructorToDoubtByAdmin);
router.delete('/:doubtId/messages/:messageId', ...doubtIdValidation, ...messageIdValidation, handleValidationErrors, deleteDoubtMessageByAdmin);
router.delete('/:doubtId', ...doubtIdValidation, handleValidationErrors, deleteDoubtThreadByAdmin);

export default router;