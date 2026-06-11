const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');


// PASSWORD STRENGTH VALIDATOR (SYNCHRONIZED)
const isStrongPassword = (password) => {
    // Requires min 8 characters, 1 lowercase, 1 uppercase, and 1 special symbol character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
};


// SESSION AUTHENTICATION GUARD MIDDLEWARE
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
        return next();
    }

    return res.status(401).json({
        error: "Unauthorized. Please log in first."
    });
};


// GET PROFILE
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [rows] = await db.query(
            'SELECT username, email FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to load profile'
        });
    }
});

// UPDATE PROFILE

router.put('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                error: 'Username and email are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
            [username, email, userId]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        await db.query(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, userId]
        );

        req.session.user.username = username;

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to update profile'
        });
    }
});

// ==============================
// CHANGE PASSWORD
// ==============================
router.put('/change-password', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                error: 'Both password fields are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({
                error: 'Password is not strong enough'
            });
        }

        // Verify user exists before making structural modifications
        const [users] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        // Securely hash the verified payload updates
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to change password'
        });
    }
});

// ==============================
// DELETE ACCOUNT
// ==============================
router.delete('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        await db.query(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    error: 'Failed to destroy session'
                });
            }

            res.clearCookie('connect.sid');

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Failed to delete account'
        });
    }
});

module.exports = router;