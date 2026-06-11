const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
    console.log("===== REGISTER ROUTE HIT =====");
    console.log("Request body:", req.body);


    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

   db.query(
    'INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [username, email, hashedPassword],
    (err, results) => {
        console.log("Insert attempt started");
        if (err) {
            console.error("MySQL Insert Error:", err);
            return res.status(500).send("Database Error");
        }
        console.log("Insert success:", results);
        res.redirect('/login.html');
    }
);

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).send("Internal Server Error");
    }
});



// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) throw err;

            if (results.length === 0) {
                return res.send("User not found");
            }

            const user = results[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.user = user;
                res.redirect('/dashboard.html');
            } else {
                res.send("Wrong password");
            }
        }
    );
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

module.exports = router;
