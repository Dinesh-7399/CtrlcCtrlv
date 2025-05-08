// server/src/controllers/authController.js

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // <-- Import jsonwebtoken
import prisma from '../config/db.js'; // NOTE: Assuming this path was correct previously
import { validationResult } from 'express-validator';

const SALT_ROUNDS = 10;

// --- User Registration Controller (Keep as before) ---
export const registerUser = async (req, res, next) => {
  // ... (existing registration code remains here) ...
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password, name } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ errors: [{ msg: 'User with this email already exists.' }] });
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: 'STUDENT' },
      select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
    });
    res.status(201).json({ message: 'User registered successfully.', user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ errors: [{ msg: 'Server error during registration.' }] });
  }
};


// --- User Login Controller --- NEW FUNCTION ---
export const loginUser = async (req, res, next) => {
  // 1. Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. Extract credentials
  const { email, password } = req.body;

  try {
    // 3. Find user by email
    const token = req.cookies?.token; // Get token from cookies (if any)
    if(token){
      return res.status(400).json({ errors: [{ msg: 'Already logged in. Please log out first.' }] });
    }
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 4. If user not found or password doesn't match, return unauthorized
    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Invalid credentials.' }] }); // Unauthorized
    }

    // 5. Compare submitted password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ errors: [{ msg: 'Invalid credentials.' }] }); // Unauthorized
    }

    // 6. User authenticated, create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        // Include other non-sensitive info if needed, e.g., name: user.name
      },
    };

    // 7. Sign the JWT
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d'; // Default to 1 day if not set

    if (!jwtSecret) {
        console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
        return res.status(500).json({ errors: [{ msg: 'Server configuration error.' }] });
    }

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: jwtExpiresIn },
      (err, token) => {
        if (err) {
            console.error("JWT Signing Error:", err);
             // Pass error to global handler or return generic error
            return res.status(500).json({ errors: [{ msg: 'Error generating authentication token.' }] });
        }

        // 8. Send JWT back via HttpOnly Cookie (More Secure)
        const cookieExpirationDays = parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '1', 10);
        res.cookie('token', token, {
          httpOnly: true, // Cannot be accessed by client-side JS
          secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
          sameSite: 'Lax', // Or 'Strict' - CSRF protection ('Lax' is often a good balance)
          maxAge: cookieExpirationDays * 24 * 60 * 60 * 1000 // Cookie expiry in milliseconds
        });

        // 9. Send success response (excluding password and potentially token)
        res.status(200).json({
          message: 'Login successful.',
          user: { // Send back user info needed by frontend (NO password!)
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
          // Optionally send token here too if needed, but cookie is primary mechanism
          // token: token
        });
      }
    );

  } catch (error) {
    console.error("Login Error:", error);
     // Pass error to global handler or return generic error
    res.status(500).json({ errors: [{ msg: 'Server error during login.' }] });
  }
};

export const logoutUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token; // Get token from cookies (if any)
    if(!token) {
      return res.status(400).json({ errors: [{ msg: 'No active session found.' }] });
    }
    // Clear the cookie by setting its expiration date to the past
    res.cookie('token', '', { expires: new Date(0), httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.status(200).json({ message: 'Logout successful.' });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ errors: [{ msg: 'Server error during logout.' }] });
  }
}