require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();

const isStrongPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
    return regex.test(password);
};


//middleware

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 600000,  // auto logout for 10 minutes
        httpOnly: true,
        secure: false 
    } 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/signup-step1', async (req, res) => {
    const { name, email } = req.body;

    try {
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (existingUser.length > 0) {
            return res.redirect('/signup.html?error=email_exists');
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        req.session.signup = { name, email, otp };

        const mailOptions = {
            from: '"Moneta Team" <no-reply@moneta.com>',
            to: email,
            subject: 'Your Moneta Verification Code',
            html: `<h2>Welcome to Moneta!</h2><p>Your verification code is: <b>${otp}</b></p>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error("Email Error:", error);
                return res.redirect('/signup.html?error=email_failed');
            }
            res.redirect('/signup-otp.html');
        });

    } catch (err) {
        console.error(err);
        res.redirect('/signup.html?error=server');
    }
});

app.post('/verify-signup-otp', (req, res) => {
    if (!req.session.signup) return res.redirect('/signup.html');

    if (parseInt(req.body.otp) === req.session.signup.otp) {
        req.session.signup.otpVerified = true; 
        res.redirect('/signup-password.html');
    } else {
        res.redirect('/signup-otp.html?error=otp');
    }
});

app.get('/resend-signup-otp', async (req, res) => {
    try {
        if (!req.session.signup) {
            return res.redirect('/signup.html?error=session_expired');
        }

        const { name, email } = req.session.signup;
        const newOtp = Math.floor(100000 + Math.random() * 900000);
        req.session.signup.otp = newOtp;

        const mailOptions = {
            from: '"Moneta Team" <no-reply@moneta.com>',
            to: email,
            subject: 'Your New Moneta Verification Code',
            html: `<h2>New OTP Requested</h2><p>Hello ${name}, your new verification code is: <b>${newOtp}</b></p>`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error("Resend Error:", error);
                return res.redirect('/signup-otp.html?error=email_failed');
            }
            res.redirect('/signup-otp.html?status=resent');
        });
    } catch (err) {
        console.error(err);
        res.redirect('/signup-otp.html?error=server');
    }
});

app.post('/signup-password', async (req, res) => {
    try {
        if (!req.session.signup || !req.session.signup.otpVerified) {
            return res.redirect('/signup.html');
        }

        const { password, confirm } = req.body;

        if (!isStrongPassword(password)) {
            return res.redirect('/signup-password.html?error=weak');
        }

        if (password !== confirm) {
            return res.redirect('/signup-password.html?error=match');
        }
        
        req.session.signup.password = await bcrypt.hash(password, 10);
        res.redirect('/signup-username.html');
    } catch (err) {
        console.error(err);
        res.redirect('/signup-password.html?error=server');
    }
});

app.post('/signup-final', async (req, res) => {
    try {
        if (!req.session.signup || !req.session.signup.password) {
            return res.redirect('/signup.html');
        }

        const { username } = req.body;
        const data = req.session.signup;
        
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE username = ?', 
            [username]
        );

        if (existingUser.length > 0) {
            return res.redirect('/signup-username.html?error=username_exists');
        }

        await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, data.email, data.password]
        );

        req.session.signup = null; 
        res.redirect('/login.html?success=registered');

    } catch (err) {
        console.error(err);
        res.redirect('/signup-username.html?error=server');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.redirect('/login.html?error=user');
        }

        const user = results[0];

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.user = { id: user.id, username: user.username }; 
            return res.redirect('/dashboard.html');
        } else {
            return res.redirect('/login.html?error=password');
        }
    } catch (err) {
        console.error(err);
        res.redirect('/login.html?error=server');
    }
});


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        req.session.user = {
            id: req.user.id,
            username: req.user.displayName
        };
        res.redirect('/dashboard.html');
    }
);

app.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.redirect('/forgot.html?status=error'); 
                }

                if (result.affectedRows === 0) {
                    return res.redirect('/forgot.html?status=notfound'); 
                }

                res.redirect('/forgot.html?status=success'); 
            }
        );
    } catch (err) {
        res.redirect('/forgot.html?status=error');
    }
});

app.post('/forgot-step1', async (req, res) => {
    const { email } = req.body;
    
    const [user] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) return res.redirect('/forgot.html?status=notfound');

    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.forgot = { email, otp };

    const mailOptions = {
        from: '"Moneta Support" <support@moneta.com>',
        to: email,
        subject: 'Reset Your Moneta Password',
        html: `<p>Your password reset code is: <b>${otp}</b></p>`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return res.redirect('/forgot.html?status=error');
        res.redirect('/forgot-otp.html');
    });
});

app.post('/verify-forgot-otp', (req, res) => {
    if (!req.session.forgot) {
        return res.redirect('/forgot.html');
    }

    if (parseInt(req.body.otp) === req.session.forgot.otp) {
        req.session.forgot.verified = true; 
        return res.redirect('/forgot-password.html');
    } else {
        return res.redirect('/forgot-otp.html?error=otp');
    }
});

app.get('/resend-forgot-otp', async (req, res) => {
    if (!req.session.forgot) return res.redirect('/forgot.html');

    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.forgot.otp = otp;

    const mailOptions = {
        from: '"Moneta Support" <support@moneta.com>',
        to: req.session.forgot.email,
        subject: 'New Password Reset Code',
        html: `<p>Your new reset code is: <b>${otp}</b></p>`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return res.redirect('/forgot-otp.html?error=email_failed');
        res.redirect('/forgot-otp.html?status=resent');
    });
});

app.post('/reset-password-final', async (req, res) => {
    try {
        const { password, confirm } = req.body;
        
        if (!req.session.forgot || !req.session.forgot.email) {
            return res.redirect('/forgot.html?status=error');
        }

        if (!isStrongPassword(password)) {
            return res.redirect('/forgot-password.html?error=weak');
        }

        if (password !== confirm) {
            return res.redirect('/forgot-password.html?error=match');
        }

        const hashed = await bcrypt.hash(password, 10);

        await db.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashed, req.session.forgot.email]
        );

        req.session.forgot = null;
        res.redirect('/success.html');
        
    } catch (err) {
        console.error(err);
        res.redirect('/forgot-password.html?error=server');
    }
});

app.get('/dashboard.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); 
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.send("Error logging out");
        }

        res.clearCookie('connect.sid');

        res.redirect('/login.html');
    });
});