# Financial System (Moneta)

A Node.js and Express financial planning web application featuring interactive tools, session-backed authentication, multi-step OTP-validated signup, password recovery, and secure Google OAuth sign-in.

## Features

- **Multi-Step Signup with Email Verification:** Protects registration via automated 6-digit One-Time Passwords (OTP) delivered via SMTP.
- **Dual Login Methods:** Traditional email/password authentication alongside streamlined Google OAuth 2.0 social login.
- **Secure Password Reset:** Secure self-service account recovery utilizing OTP validation.
- **Session-Based State Management:** Protected routes backed by automated 10-minute idle session destruction.
- **Financial Planning Utilities:** Interactive client-side pages including a budget planner, goal tracker, strategic dashboard, ROI calculator, and user profile management.

---

## Project Structure

```text
├── server.js          # Core Express server, routing layer, session handling, and authentication logic
├── db.js              # MySQL connection pool initialization using mysql2/promise
├── Public/            # Static client-side assets
│   ├── CSS/           # Application stylesheets
│   ├── JS/            # Interactive client scripts (calculators, validation)
│   ├── *.html         # Multi-step authentication views and utility screens
└── Routes/            # Isolated route modules
```

---

## Prerequisites

Before running this application, make sure you have:

- **Node.js:** Version 18.x or newer
- **MySQL Server:** Local instance running up-to-date database services
- **Google Workspace / Gmail Account:** To manage secure email automated transmissions
- **Google Cloud Platform Developer Account:** To support active Google OAuth application clients

---

## Installation & Setup

### 1. Install Dependencies

Navigate into your project folder and install the required NPM packages:

```bash
npm install
```

### 2. Configure Environment Variables

Create a file named `.env` in your project root directory and define the configuration values below. Keep this file private and never push it to version control.

```env
PORT=3000

DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password_here
DB_NAME=finance_app

SESSION_SECRET=your_random_secret_key_here

EMAIL_USER=your_student_email@siswa.um.edu.my
EMAIL_PASS=your_16_character_google_app_password_here

GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 3. Initialize the MySQL Database

Log into MySQL Workbench or the MySQL command line and execute:

```sql
CREATE DATABASE IF NOT EXISTS finance_app;
USE finance_app;
SELECT * FROM users;
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    google_id VARCHAR(255) UNIQUE,
    password VARCHAR(255) NULL
);
```

> **Note:** The `password` field is allowed to be `NULL` so users who register via Google OAuth can be stored without a local password.

### 4. Start the Server

Run:

```bash
npm start
```

The console should display:

```text
Server running on port 3000
```

Open your browser and navigate to:

```text
http://localhost:3000/login.html
```

---

## Application Route Mapping

### Authentication Registration Flow

| Route | Description |
|---------|-------------|
| `/signup.html` | Step 1: Submit name and email, generate OTP |
| `/signup-otp.html` | Step 2: Verify OTP |
| `/signup-password.html` | Step 3: Create password with validation |
| `/signup-username.html` | Step 4: Create unique username and save user |

### Password Recovery Flow

| Route | Description |
|---------|-------------|
| `/forgot.html` | Request password reset OTP |
| `/forgot-otp.html` | Verify password reset OTP |
| `/forgot-password.html` | Set a new bcrypt-hashed password |

### Functional Interfaces

| Route | Description |
|---------|-------------|
| `/login.html` | Login page with email/password and Google OAuth |
| `/home-page.html` | User landing page after login |
| `/dashboard.html` | Protected dashboard route |
| `/logout` | Destroy session and log user out safely |

---

## Security Features

- Passwords hashed using **bcrypt**
- OTP-based email verification
- OTP-based password recovery
- Session authentication with inactivity timeout
- Google OAuth 2.0 login support
- Secure MySQL database storage

---

## Troubleshooting

### Nodemailer Cannot Send Emails

If using a Gmail or university Google account (`@siswa.um.edu.my`):

1. Enable **2-Step Verification** on your Google Account.
2. Search for **App Passwords**.
3. Generate a new 16-character App Password.
4. Replace `EMAIL_PASS` in your `.env` file with the generated password.

Example:

```env
EMAIL_PASS=abcd efgh ijkl mnop
```

### Google OAuth Login Fails

Verify the following:

- The OAuth credentials are correct.
- The Google Cloud Console configuration matches your local application URL.
- The Authorized Redirect URI is exactly:

```text
http://localhost:3000/auth/google/callback
```

### MySQL Connection Error

Ensure:

- MySQL service is running.
- Database `finance_app` exists.
- Username and password in `.env` are correct.
- Port 3306 is accessible.

---

## Technology Stack

### Backend

- Node.js
- Express.js
- MySQL
- mysql2
- Express Session
- bcrypt
- Passport.js
- Google OAuth 2.0

### Frontend

- HTML5
- CSS3
- JavaScript

### Email Service

- Nodemailer
- Gmail SMTP

---

## Authors

Developed as part of a Financial Planning System project focused on secure authentication, personal finance management, and user-friendly financial planning tools