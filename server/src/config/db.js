// server/src/config/db.js
import { PrismaClient } from '@prisma/client';

// PrismaClient is either an instance that's already been created and stored on the global object,
// or a new instance if one doesn't exist yet. This prevents creating too many instances
// of PrismaClient in development due to hot reloading. In production, it will just be a single instance.

// Add prisma to the NodeJS global type.
// This is purely for TypeScript type safety and can be omitted in JavaScript,
// but it's good practice to be aware of if you ever migrate to TS.
// globalThis.prisma = globalThis.prisma || new PrismaClient();

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    // Optional: Add logging configuration for production if needed
    // log: ['query', 'info', 'warn', 'error'],
  });
  console.log("Prisma Client initialized for production.");
} else {
  // In development, ensure a single instance is used across hot reloads.
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'], // More verbose logging in development
    });
    console.log("Prisma Client initialized for development (new instance).");
  }
  prisma = global.__prisma;
  console.log("Prisma Client retrieved for development (cached or new).");
}

export default prisma;
