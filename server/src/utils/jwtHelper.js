// server/src/utils/jwtHelper.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORRECTED PATH:
// Assumes your .env file is in the 'server/' root directory (parent of 'src/').
// 'src/utils/' is two levels down from 'server/'.
dotenv.config({ path: path.join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

if (!JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in .env file. " +
    "Please ensure it's set in server/.env and the path in jwtHelper.js is correct. " +
    `Current path attempted: ${path.join(__dirname, '../../.env')}`
  );
  process.exit(1);
}

/**
 * Generates a JSON Web Token.
 * @param {object} payload - The payload to include in the token (e.g., { userId, role }).
 * @param {string} [expiresIn] - Optional: Override the default token expiration time (e.g., "1h", "7d").
 * @returns {string} The generated JWT.
 */
export const generateToken = (payload, expiresIn) => {
  try {
    // Log if JWT_SECRET is a placeholder - for debugging only, remove in prod
    if (JWT_SECRET === "PASTE_YOUR_ACTUAL_STRONG_RANDOM_GENERATED_SECRET_KEY_HERE" || JWT_SECRET === "YOUR_RANDOM_SECRET_KEY_FOR_JWT" || JWT_SECRET === "REPLACE_WITH_A_VERY_STRONG_RANDOM_SECRET_KEY" || JWT_SECRET === "YOUR_SUPER_STRONG_JWT_SECRET_KEY_HERE") {
      console.warn("WARNING: Using a placeholder JWT_SECRET for token generation. Please set a strong, unique secret in your .env file.");
    }
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: expiresIn || JWT_EXPIRES_IN,
    });
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw new Error('Token generation failed.'); // Consider more specific error or logging
  }
};

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT to verify.
 * @returns {object | null} The decoded payload if the token is valid, otherwise null.
 */
export const verifyToken = (token) => {
  if (!token) {
    // console.warn('Attempted to verify an empty or null token.'); // Can be noisy
    return null;
  }
  // Log if JWT_SECRET is a placeholder - for debugging only, remove in prod
  if (JWT_SECRET === "PASTE_YOUR_ACTUAL_STRONG_RANDOM_GENERATED_SECRET_KEY_HERE" || JWT_SECRET === "YOUR_RANDOM_SECRET_KEY_FOR_JWT" || JWT_SECRET === "REPLACE_WITH_A_VERY_STRONG_RANDOM_SECRET_KEY" || JWT_SECRET === "YOUR_SUPER_STRONG_JWT_SECRET_KEY_HERE") {
    console.warn("WARNING: Using a placeholder JWT_SECRET for token verification. This will likely fail if the generation used a different placeholder or a real secret.");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded; // Contains the payload (e.g., { userId, role, iat, exp })
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT verification failed: Token expired. (iat: %s, exp: %s)', new Date(error.inner?.payload?.iat * 1000), error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      // This is the most common error if secrets mismatch or token is malformed
      console.warn(`JWT verification failed: ${error.message}. Token received: ${token.substring(0, 20)}...`);
    } else {
      console.error('Unexpected error verifying JWT:', error);
    }
    return null; // Return null for any verification failure
  }
};