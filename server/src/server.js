// server/src/server.js

// --- 1. Import Core Dependencies ---
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// --- 2. Import Custom Modules & Middleware ---
import prisma from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRouter from './routes/auth.routes.js';
import courseRouter from './routes/course.routes.js';
import userRouter from './routes/user.routes.js';
import articleRouter from './routes/article.routes.js';
import categoryRouter from './routes/category.routes.js';
import testimonialRouter from './routes/testimonial.routes.js';
import enrollmentRouter from './routes/enrollment.routes.js';
import paymentRouter from './routes/payment.routes.js';
import noteRouter from './routes/note.routes.js';
import doubtRouter from './routes/doubt.routes.js';
import uploadRouter from './routes/upload.routes.js';
import platformRouter from './routes/platform.routes.js';
// Admin Routes
import adminCourseRouter from './routes/adminCourse.routes.js';
import adminUserRouter from './routes/adminUser.routes.js';
import adminArticleRouter from './routes/adminArticle.routes.js';
import adminDashboardRouter from './routes/adminDashboard.routes.js';
import adminAnalyticsRouter from './routes/adminAnalytics.routes.js';
import adminSettingsRouter from './routes/adminSettings.routes.js';
import adminCategoryRouter from './routes/adminCategory.routes.js';
import adminTestimonialRouter from './routes/adminTestimonial.routes.js';
import adminDoubtRouter from './routes/adminDoubt.routes.js';

import initializeSocketIO from './socket/index.js';

// --- 3. Initial Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// --- 4. Initialize Express Application & HTTP Server ---
const app = express();
const server = http.createServer(app);

// --- 5. Initialize Socket.IO ---
const io = new SocketIOServer(server, {
  cors: {
    origin: (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_DEV_URL || 'http://localhost:5173').split(','),
    methods: ["GET", "POST"],
    credentials: true
  }
});
initializeSocketIO(io);

// --- 6. Configure Core Middleware ---
const corsOptions = {
  origin: (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_DEV_URL || 'http://localhost:5173').split(','),
  credentials: true,
};
app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Rate Limiting ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use('/api/', apiLimiter);

// --- Serve Static Files ---
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// --- 7. Define API Routes ---
app.get('/api/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'UP',
      message: 'API is healthy and connected to the database.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health Check Failed:', error?.message);
    next(error);
  }
});

const API_PREFIX = '/api';
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/courses`, courseRouter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/articles`, articleRouter);
app.use(`${API_PREFIX}/categories`, categoryRouter);
app.use(`${API_PREFIX}/testimonials`, testimonialRouter);
app.use(`${API_PREFIX}/enrollments`, enrollmentRouter);
app.use(`${API_PREFIX}/payment`, paymentRouter);
app.use(`${API_PREFIX}/notes`, noteRouter);
app.use(`${API_PREFIX}/doubts`, doubtRouter);
app.use(`${API_PREFIX}/upload`, uploadRouter);
app.use(`${API_PREFIX}/platform`, platformRouter);

const ADMIN_API_PREFIX = `${API_PREFIX}/admin`;
app.use(`${ADMIN_API_PREFIX}/dashboard`, adminDashboardRouter);
app.use(`${ADMIN_API_PREFIX}/courses`, adminCourseRouter);
app.use(`${ADMIN_API_PREFIX}/users`, adminUserRouter);
app.use(`${ADMIN_API_PREFIX}/articles`, adminArticleRouter);
app.use(`${ADMIN_API_PREFIX}/analytics`, adminAnalyticsRouter);
app.use(`${ADMIN_API_PREFIX}/platform-settings`, adminSettingsRouter);
app.use(`${ADMIN_API_PREFIX}/categories`, adminCategoryRouter);
app.use(`${ADMIN_API_PREFIX}/testimonials`, adminTestimonialRouter);
app.use(`${ADMIN_API_PREFIX}/doubts`, adminDoubtRouter);

// --- 8. Global Error Handling ---
app.use(errorHandler);

// --- 9. Handle Not Found ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found - Cannot ${req.method} ${req.originalUrl}` });
});

// --- 10. Database Connection Check ---
const checkDbConnection = async () => {
  console.log('Attempting to connect to the database...');
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful on startup.");
  } catch (error) {
    console.error("❌ FATAL: Failed to connect to the database on startup.");
    console.error(error);
    process.exit(1);
  }
};

// --- 11. Server Startup ---
const startServer = async () => {
  await checkDbConnection();

  const PORT = process.env.PORT || 5001;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  server.listen(PORT, () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`   API available at http://localhost:${PORT}${API_PREFIX}`);
    console.log(`   Health check: http://localhost:${PORT}${API_PREFIX}/health`);
    console.log(`   Socket.IO initialized and listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} signal received: closing HTTP server gracefully...`);
    server.close(async () => {
      console.log('🔌 HTTP server closed.');
      io.close(() => {
        console.log('🔌 Socket.IO connections closed.');
      });
      try {
        await prisma.$disconnect();
        console.log('🔒 Database connection closed gracefully.');
      } catch (err) {
        console.error('Error closing database connection:', err);
      } finally {
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
