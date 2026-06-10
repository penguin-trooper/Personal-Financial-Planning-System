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
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));
const marketRoutes = require('./Routes/market');

app.use('/api/market', marketRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));

const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Login required' });
        }
        return res.redirect('/login.html?error=session');
    }
    next();
};

const marketFallback = {
    stocks: [
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: '$875.40', change: '3.02%', trend: 'up' },
        { symbol: 'AAPL', name: 'Apple Inc.', price: '$189.30', change: '1.24%', trend: 'up' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: '$172.82', change: '1.56%', trend: 'down' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '$171.95', change: '0.43%', trend: 'down' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '$184.70', change: '2.11%', trend: 'up' }
    ],
    news: [
        { title: 'Fed Signals Possible Rate Cut Later This Year', description: 'Federal Reserve officials hint at potential interest rate reductions if inflation continues to ease toward the 2% target.', url: 'https://www.reuters.com/world/us/fed-signals-possible-rate-cut-later-this-year/', source: 'Reuters', publishedAt: '2026-06-10', category: 'Monetary Policy' },
        { title: 'NVIDIA Surges After Record Data Center Revenue', description: 'NVIDIA reports record-breaking quarterly earnings driven by surging demand for AI chips and data center infrastructure.', url: 'https://www.cnbc.com/2026/06/10/nvidia-surges-after-record-data-center-revenue.html', source: 'CNBC', publishedAt: '2026-06-10', category: 'Technology' },
        { title: 'Bitcoin Breaks $62,000 as Institutional Demand Rises', description: 'Cryptocurrency markets rally as major institutional investors increase Bitcoin holdings amid growing mainstream adoption.', url: 'https://www.reuters.com/technology/bitcoin-breaks-62000-as-institutional-demand-rises/', source: 'Reuters', publishedAt: '2026-06-10', category: 'Crypto' },
        { title: 'Oil Prices Dip Amid Rising Global Supply', description: 'Crude oil futures fell as OPEC+ members signal plans to gradually increase production output over the coming months.', url: 'https://www.cnbc.com/2026/06/10/oil-prices-dip-amid-rising-global-supply.html', source: 'CNBC', publishedAt: '2026-06-10', category: 'Commodities' },
        { title: 'Wall Street Firms Track Margin Pressure', description: 'Financial firms are watching earnings as rates stay elevated and spending slows.', url: 'https://www.marketwatch.com/investing', source: 'MarketWatch', publishedAt: '2026-06-10', category: 'Finance' },
        { title: 'Tech Stocks Extend Gains', description: 'Large-cap technology names lead the market higher on strong demand for AI infrastructure.', url: 'https://finance.yahoo.com/news/technology-stocks-extend-gains/', source: 'Yahoo Finance', publishedAt: '2026-06-10', category: 'Technology' }
    ]
};

async function getMarketData(dataKey) {
    try {
        const [rows] = await db.query(
            'SELECT data_json FROM market_cache WHERE data_key = ? ORDER BY fetched_at DESC LIMIT 1',
            [dataKey]
        );
        if (rows.length) return JSON.parse(rows[0].data_json);
    } catch (err) {
        console.error(`Market cache fetch failed for ${dataKey}:`, err);
    }
    return marketFallback[dataKey];
}

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

app.post('/resend-otp', async (req, res) => {
    try {
        let email, name, sessionKey;

        // Check if the user is in the Signup flow
        if (req.session.signup) {
            email = req.session.signup.email;
            name = req.session.signup.name || "User";
            sessionKey = 'signup';
        } 
        // Check if the user is in the Forgot Password flow
        else if (req.session.forgot) {
            email = req.session.forgot.email;
            name = "User";
            sessionKey = 'forgot';
        } 
        
        // If neither exists, the session is empty
        if (!email) {
            console.error("Resend failed: No active session data found");
            return res.status(400).send("Session expired. Please start over.");
        }

        const newOTP = Math.floor(100000 + Math.random() * 900000);
        req.session[sessionKey].otp = newOTP; // Update the correct session object

        const mailOptions = {
            from: '"Moneta Team" <no-reply@moneta.com>',
            to: email,
            subject: 'Your New Moneta Verification Code',
            html: `<h2>New OTP Requested</h2><p>Hello ${name}, your new verification code is: <b>${newOTP}</b></p>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`New OTP ${newOTP} sent to ${email}`);
        res.status(200).send("OTP resent successfully");

    } catch (error) {
        console.error("Error in /resend-otp:", error);
        res.status(500).send("Failed to resend email");
    }
});

app.get('/dashboard.html', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }
    res.redirect('/home-page.html'); 
});

app.get('/roi-calculator.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'roi-calculator.html'));
});

app.get('/market-insight.html', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'market-insight.html'));
});

app.post('/api/roi/save', requireLogin, async (req, res) => {
    try {
        const allowedTypes = ['roi', 'compound', 'simple'];
        const calcType = req.body.calc_type || 'compound';
        const initial = Number(req.body.initial_amount);
        const monthly = Number(req.body.monthly_contribution || 0);
        const rate = Number(req.body.interest_rate);
        const years = Number(req.body.time_period);
        const finalValue = Number(req.body.result_final_value);
        const roiPct = Number(req.body.result_roi_pct);

        if (!allowedTypes.includes(calcType)) return res.status(400).json({ error: 'Invalid calculation type' });
        if (!Number.isFinite(initial) || initial < 0) return res.status(400).json({ error: 'Invalid initial amount' });
        if (!Number.isFinite(monthly) || monthly < 0) return res.status(400).json({ error: 'Invalid monthly contribution' });
        if (initial <= 0 && monthly <= 0) return res.status(400).json({ error: 'Enter an investment amount' });
        if (!Number.isFinite(rate) || rate < 0 || rate > 100) return res.status(400).json({ error: 'Invalid interest rate' });
        if (!Number.isFinite(years) || years <= 0) return res.status(400).json({ error: 'Invalid time period' });
        if (!Number.isFinite(finalValue) || finalValue < 0) return res.status(400).json({ error: 'Invalid final value' });
        if (!Number.isFinite(roiPct)) return res.status(400).json({ error: 'Invalid ROI result' });

        const [result] = await db.query(
            `INSERT INTO roi_history
            (user_id, calc_type, initial_amount, monthly_contribution, interest_rate, time_period, final_value, result_roi_pct)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.session.user.id, calcType, initial, monthly, rate, years, finalValue, roiPct]
        );

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('ROI save failed:', err);
        res.status(500).json({ error: 'Unable to save ROI calculation' });
    }
});

app.get('/api/roi/history', requireLogin, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, calc_type, initial_amount, monthly_contribution, interest_rate,
                    time_period, final_value, result_roi_pct, created_at
             FROM roi_history
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 20`,
            [req.session.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('ROI history fetch failed:', err);
        res.status(500).json({ error: 'Unable to load ROI history' });
    }
});

app.delete('/api/roi/history/:id', requireLogin, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM roi_history WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'History item not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('ROI history delete failed:', err);
        res.status(500).json({ error: 'Unable to delete ROI history item' });
    }
});

app.get('/api/market/stocks', requireLogin, async (req, res) => {
    const data = await getMarketData('stocks');
    if (!data) return res.status(503).json({ error: 'Market stock data unavailable' });
    res.json(data);
});

app.get('/api/market/news', requireLogin, async (req, res) => {
    const data = await getMarketData('news');
    if (!data) return res.status(503).json({ error: 'Market news unavailable' });
    res.json(data);
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
    require('child_process').exec('start http://localhost:3000/login.html');
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
