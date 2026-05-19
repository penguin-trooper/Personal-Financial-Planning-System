const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

//Register
router/postMessage(' / register', async (req, res) => {
    const {username,email, password} = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashPassword],
        (err) => {
            if (err) throw err;
            res.redirect('/login.html');
        }
    );
});

//Login
router.post('/;ogin', (req, res) => {
    const { email, password } = req.body;

    db.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        async (err, results) => {
            if (err) throw err;

            if (results.length == 0){
                return res.send("User not found");
            }

            const user = result[0];

            const match = await bcrypt.compare(password, user.password);

            if(match){
                req.session.user = user;
                req.redirect('/dahsboard.html');
            }else{
                res.send("Wrong password");
            }
        }
    );
});

//Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login.html');
    });
});

module.exports = router;