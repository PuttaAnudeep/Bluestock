const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
const port = 5000;

// Middleware to parse JSON request body
app.use(bodyParser.json());
app.use(cors());

// MySQL Connection Pool (Better for multiple requests)
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root', // replace with your MySQL password
    database: 'bluestock',
    waitForConnections: true,
    connectionLimit: 10, // Limit concurrent connections
    queueLimit: 0
});

// Signup route to handle the form submission
app.post('/signup', (req, res) => {
    console.log("Received data:", req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Hash the password before saving to the database
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error("Error hashing password:", err);
            return res.status(500).json({ success: false, message: 'Error hashing password' });
        }

        // Insert user data into the database using a connection from the pool
        pool.getConnection((err, connection) => {
            if (err) {
                console.error("Error getting connection:", err);
                return res.status(500).json({ success: false, message: 'Database connection error' });
            }

            const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
            connection.query(query, [name, email, hashedPassword], (err, result) => {
                connection.release(); // Release connection after query execution

                if (err) {
                    console.error("Error inserting data into database:", err);
                    return res.status(500).json({ success: false, message: 'Error inserting data into database' });
                }

                console.log("User inserted with ID:", result.insertId);
                res.status(200).json({ success: true, message: 'User created successfully' });
            });
        });
    });
});

// Gracefully close the connection pool when the server stops
process.on('SIGINT', () => {
    pool.end((err) => {
        if (err) {
            console.error("Error closing MySQL pool:", err);
        } else {
            console.log("MySQL pool closed.");
        }
        process.exit();
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});