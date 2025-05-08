// server/src/server.js

// --- 1. Import Core Dependencies ---
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 2. Import Custom Modules & Middleware ---
import prisma from './config/db.js'; // <-- Corrected path assuming db.js is in src/db/
import authRouter from './routes/auth.routes.js'; // Path relative to src
// import courseRoutes from './routes/course.routes.js'; // Future routes
import userRoutes from './routes/user.routes.js'; // Future routes
import { errorHandler } from './middlewares/errorHandler.js'; // Import global error handler
import courseRoutes from './routes/course.route.js'; // Import course routes
import adminCourseRouter from './routes/adminCourse.routes.js';
import adminUserRouter from './routes/adminUser.routes.js'; 
import articleRouter from './routes/article.routes.js';
import adminArticleRouter from './routes/adminArticle.route.js'; // Import article routes
import enrollmentRouter from './routes/enrollment.routes.js';
// --- 3. Initial Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // 'src' directory
// Load .env file from the parent directory (server root)
dotenv.config({ path: path.join(__dirname, '../.env') });

// --- 4. Initialize Express Application ---
const app = express();

// --- 5. Configure Core Middleware ---
const corsOptions = {
  // Read allowed origins from .env, fallback to development default
  origin: (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_DEV_URL || 'http://localhost:5173').split(','),
  credentials: true, // Allow cookies/auth headers
};
app.use(cors(corsOptions)); // Use CORS middleware
app.use(cookieParser()); // Parse cookies
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// --- Optional: Serve static files (e.g., uploads) ---
// Serve files from 'public/uploads' directory in the root 'server' folder
// app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// --- 6. Define API Routes ---
// Health Check Route (passes errors to global handler)
app.get('/api/health', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Simple DB check
    res.status(200).json({
      status: 'UP',
      message: 'API is healthy and connected to database.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health Check Failed:', error?.message);
    // Pass the error to the global error handler
    next(error);
  }
});

// Mount Application Routers
app.use('/api/auth', authRouter); // Authentication routes
app.use('/api/courses', courseRoutes); // Add course routes later
app.use('/api/users', userRoutes);     // Add user routes later
app.use('/api/admin/courses', adminCourseRouter); 
app.use('/api/admin/users', adminUserRouter);   
app.use('/api/articles', articleRouter);
app.use('/api/admin/articles', adminArticleRouter); 
app.use('/api/enrollments', enrollmentRouter);
// ... add other application routers here ...


// --- 7. Global Error Handling Middleware (MUST be AFTER routes) ---
app.use(errorHandler);

// --- 8. Handle Not Found Routes (404 - MUST be LAST route handler) ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found - Cannot ${req.method} ${req.originalUrl}` });
});


// --- 9. Database Connection Check Function ---
const checkDbConnection = async () => {
  console.log('Attempting to connect to the database...');
  try {
    await prisma.$connect(); // Explicitly connect on startup
    console.log("✅ Database connection successful on startup.");
  } catch (error) {
    console.error("❌ FATAL: Failed to connect to the database on startup.");
    console.error(error); // Log the full error for details
    process.exit(1); // Exit if DB connection fails
  }
};

// --- 10. Server Startup Function ---
const startServer = async () => {
  await checkDbConnection(); // Verify DB connection before starting HTTP server

  const PORT = process.env.PORT || 5001;
  const NODE_ENV = process.env.NODE_ENV || 'development';

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    // Display API base URL for convenience (optional)
    console.log(`   API available at http://localhost:${PORT}/api`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // Graceful Shutdown Logic
  const shutdown = async (signal) => {
      console.log(`\n${signal} signal received: closing HTTP server gracefully...`);
      server.close(async () => {
          console.log('🔌 HTTP server closed.');
          try {
              await prisma.$disconnect(); // Disconnect Prisma client
              console.log('🔒 Database connection closed gracefully.');
          } catch (err) {
              console.error('Error closing database connection:', err);
          } finally {
              process.exit(0); // Exit process
          }
      });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM')); // Standard signal for termination
  process.on('SIGINT', () => shutdown('SIGINT'));   // Signal for Ctrl+C
};

// --- 11. Execute Server Startup ---
startServer();