# Financial System

A Node.js and Express financial planning web application with static pages, MySQL-backed authentication, OTP-based signup and password reset flows, Google sign-in, and email delivery for verification codes.

## Features

- User signup with email verification via OTP
- Login with email and password
- Forgot password flow with OTP verification
- Google OAuth sign-in
- Session-based authentication
- Static pages for planner, goals, strategy, ROI calculator, and profile screens

## Project Structure

- `server.js` - Express server, routes, sessions, authentication, and email logic
- `db.js` - MySQL connection pool
- `Public/` - Static HTML, CSS, JavaScript, and image assets
- `Routes/` - Route modules used by the app

## Prerequisites

- Node.js 18 or newer
- MySQL database
- A Gmail account or other SMTP-compatible email setup for OTP delivery
- Google OAuth credentials if you want Google login enabled

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root and fill in the required values.

   You can use `.env.example` as a template:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password_here
   DB_NAME=finance_app
   SESSION_SECRET=your_random_secret_key_here
   EMAIL_USER=your_student_email@siswa.um.edu.my
   EMAIL_PASS=your_app_password_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

3. Make sure your MySQL database exists and contains the `users` table expected by the app.

4. Start the server:

   ```bash
   npm start
   ```

5. Open the app in your browser at `http://localhost:3000`.

## Available Routes

- `/login.html` - Login page
- `/signup.html` - Signup start page
- `/signup-otp.html` - Signup OTP verification
- `/signup-password.html` - Password creation during signup
- `/signup-username.html` - Username selection during signup
- `/forgot.html` - Forgot password request page
- `/forgot-otp.html` - Forgot password OTP verification
- `/forgot-password.html` - New password entry
- `/home-page.html` - Main landing page after login
- `/dashboard.html` - Protected redirect to the home page
- `/logout` - Ends the current session

## Notes

- The current `package.json` defines `npm start`, not `npm run dev`.
- Sessions are configured with a 10-minute idle timeout in `server.js`.
- OTP delivery uses Nodemailer with Gmail settings from environment variables.

## License

No license has been specified for this project.