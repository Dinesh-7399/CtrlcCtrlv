// server/src/routes/doubt.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
// Import enums directly
import { DoubtStatus } from '@prisma/client';
import {
  createDoubt,
  getAllDoubts,
  getDoubtById,
  postMessageToDoubt,
} from '../controllers/doubtController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---
const doubtIdValidation = [ /* ... as before ... */ ];
const createDoubtValidation = [ /* ... as before ... */ ];
const postMessageValidation = [ /* ... as before ... */ ];
const getAllDoubtsValidation = [
    // ... (other query validations)
    query('status').optional().custom((value) => {
        if (!DoubtStatus) throw new Error('Server Error: DoubtStatus enum not available.');
        if (!Object.values(DoubtStatus).includes(value.toUpperCase())) throw new Error('Invalid status filter.');
        return true;
    }).toUpperCase(), // Ensure it's uppercased for comparison with enum
    // ...
];

// --- Route Definitions ---
router.post('/', authMiddleware(), ...createDoubtValidation, handleValidationErrors, createDoubt); // Added () to authMiddleware
router.get('/', authMiddleware(), ...getAllDoubtsValidation, handleValidationErrors, getAllDoubts); // Added ()
router.get('/:doubtId', authMiddleware(), ...doubtIdValidation, handleValidationErrors, getDoubtById); // Added ()
router.post('/:doubtId/messages', authMiddleware(), ...doubtIdValidation, ...postMessageValidation, handleValidationErrors, postMessageToDoubt); // Added ()

export default router;