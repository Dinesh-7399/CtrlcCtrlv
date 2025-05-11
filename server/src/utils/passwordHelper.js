// server/src/utils/passwordHelper.js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

/**
 * Hashes a plain text password.
 * @param {string} password - The plain text password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} If hashing fails.
 */
export const hashPassword = async (password) => {
  try {
    if (!password) {
      throw new Error('Password cannot be empty.');
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    // In a real app, you might want a more specific error type or logging
    throw new Error('Password hashing failed.');
  }
};

/**
 * Compares a plain text password with a hashed password.
 * @param {string} plainPassword - The plain text password.
 * @param {string} hashedPassword - The hashed password from the database.
 * @returns {Promise<boolean>} A promise that resolves to true if passwords match, false otherwise.
 * @throws {Error} If comparison fails.
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    if (!plainPassword || !hashedPassword) {
      throw new Error('Both plain password and hashed password are required for comparison.');
    }
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error comparing password:', error);
    // In a real app, you might want a more specific error type or logging
    throw new Error('Password comparison failed.');
  }
};
