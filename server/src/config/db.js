// server/src/config/db.js
import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client
const prisma = new PrismaClient({
  // Optional: Add logging based on environment
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// --- Optional: Graceful shutdown logic ---
// This ensures Prisma disconnects nicely when your app exits (already included in your server.js via process listeners)
// async function gracefulShutdown() {
//   console.log('Disconnecting Prisma Client (from db.js)...');
//   await prisma.$disconnect();
//   console.log('Prisma Client disconnected (from db.js).');
// }
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);
// --- End Optional Shutdown Logic (often handled globally in server.js) ---


// Export the singleton instance using ES Module syntax
export default prisma;