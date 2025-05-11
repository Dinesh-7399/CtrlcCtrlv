// src/routes/platform.routes.js
import express from 'express';
import { getPublicPlatformStats } from '../controllers/platformController.js';

const router = express.Router();
router.get('/public-stats', getPublicPlatformStats);
export default router;