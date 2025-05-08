// server/src/controllers/adminUserController.js

import prisma from '../config/db.js'; // <-- Verify this path is correct!
import { validationResult } from 'express-validator';
// import bcrypt from 'bcrypt'; // Needed only if implementing adminCreateUser with password

/**
 * @description Get ALL users for Admin view
 * @route GET /api/admin/users
 * @access Private (Admin)
 */
export const adminGetAllUsers = async (req, res, next) => {
    // Pagination
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '15', 10); // Adjust default limit
    const skip = (page - 1) * limit;

    // Filtering (example: filter by role or status)
    const where = {};
    if (req.query.role && ['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(req.query.role.toUpperCase())) {
        where.role = req.query.role.toUpperCase();
    }
    if (req.query.status && ['ACTIVE', 'SUSPENDED'].includes(req.query.status.toUpperCase())) {
        where.status = req.query.status.toUpperCase();
    }
    // TODO: Add search term filtering later

    // Sorting (example: sort by name or createdAt)
    const orderBy = {};
    if (req.query.sortBy === 'name') {
        orderBy.name = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
    } else { // Default sort
        orderBy.createdAt = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
    }


    try {
        const [users, totalCount] = await prisma.$transaction([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                select: { // Select fields needed for admin list (NO password)
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true, // Include new status field
                    createdAt: true,
                    emailVerified: true,
                    _count: { select: { enrollments: true }} // Example count
                },
                orderBy,
            }),
            prisma.user.count({ where }) // Count based on filter
        ]);

        res.status(200).json({
             message: 'Admin: Users retrieved successfully.',
             data: users,
             pagination: {
                 currentPage: page,
                 totalPages: Math.ceil(totalCount / limit),
                 totalUsers: totalCount,
                 pageSize: limit
             }
         });
    } catch (error) {
        console.error("Admin Error fetching all users:", error);
        next(error);
    }
};

/**
 * @description Get details for a specific user by ID
 * @route GET /api/admin/users/:userId
 * @access Private (Admin)
 */
export const adminGetUserById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const userId = parseInt(req.params.userId, 10);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { // Select all relevant fields EXCEPT password
                id: true, name: true, email: true, role: true, status: true, emailVerified: true, createdAt: true, updatedAt: true,
                profile: { select: { bio: true, avatarUrl: true, headline: true, websiteUrl: true, socialLinks: true, experience: true, education: true, projects: true } },
                enrollments: { select: { courseId: true, enrolledAt: true, course: { select: { id: true, title: true } } } }, // Include enrollments maybe
                coursesTeaching: { select: { id: true, title: true } } // Include courses taught if instructor
            }
        });

        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error(`Admin Error fetching user ${userId}:`, error);
        next(error);
    }
};

/**
 * @description Update user details (role, status, name, email) by Admin
 * @route PUT /api/admin/users/:userId
 * @access Private (Admin)
 */
export const adminUpdateUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const userId = parseInt(req.params.userId, 10);
    const { name, email, role, status } = req.body; // Get fields allowed for admin update

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email; // Admins can change email
    if (role !== undefined) dataToUpdate.role = role;   // Admins can change role
    if (status !== undefined) dataToUpdate.status = status; // Admins can change status

    if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    // Prevent admin from removing the last admin role? Requires more logic
    // Example check (simplified):
    // if (dataToUpdate.role && dataToUpdate.role !== 'ADMIN') {
    //    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    //    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true }});
    //    if (adminCount <= 1 && targetUser?.role === 'ADMIN') {
    //        return res.status(400).json({ message: "Cannot remove the last admin role." });
    //    }
    // }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { // Return updated user data (no password)
                id: true, name: true, email: true, role: true, status: true, emailVerified: true, createdAt: true, updatedAt: true
            }
        });

        res.status(200).json({ message: 'User updated successfully.', user: updatedUser });

    } catch (error) {
        console.error(`Admin Error updating user ${userId}:`, error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
             return res.status(409).json({ message: 'Conflict: This email is already in use.' });
        }
        if (error.code === 'P2025') { // Record to update not found
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }
        next(error);
    }
};


/**
 * @description Delete a user by Admin
 * @route DELETE /api/admin/users/:userId
 * @access Private (Admin)
 */
export const adminDeleteUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }

    const userId = parseInt(req.params.userId, 10);
    const adminUserId = req.user.id; // ID of the admin performing the action

    // --- CRITICAL: Prevent admin from deleting themselves ---
    if (userId === adminUserId) {
         return res.status(403).json({ message: 'Forbidden: Admins cannot delete their own account.' });
    }

    try {
        console.log(`Admin ${adminUserId} attempting to delete user ${userId}...`);

        // Prisma handles related data based on schema 'onDelete' actions (e.g., Cascade)
        await prisma.user.delete({
            where: { id: userId },
        });

        console.log(`User ${userId} deleted successfully by admin ${adminUserId}.`);
        res.status(200).json({ message: `User with ID ${userId} deleted successfully.` });
        // Or use res.status(204).send();

    } catch (error) {
        console.error(`Admin Error deleting user ${userId}:`, error);
        if (error.code === 'P2025') { // Record to delete not found
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }
         // Handle potential foreign key constraints if onDelete isn't set correctly everywhere
         if (error.code === 'P2003') {
            console.error("Foreign key constraint failed during user deletion. Check related data.", error.meta);
            return res.status(409).json({ message: `Conflict: Cannot delete user because they are still linked to other records (e.g., courses, articles). Please reassign or delete related content first.` });
        }
        next(error);
    }
};


// Optional: Implement adminCreateUser if needed (requires password hashing)
// export const adminCreateUser = async (req, res, next) => { ... };