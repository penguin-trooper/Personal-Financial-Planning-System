const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to database via pool');
        connection.query(
            "ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE",
            (alterErr) => {
                if (alterErr && alterErr.errno !== 1060) {
                    console.error('Failed to auto-add google_id column:', alterErr);
                }
                connection.release();
            }
        );
    }
});

module.exports = db.promise();