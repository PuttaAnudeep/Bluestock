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

// MySQL Connection Pool
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'root', // Replace with your MySQL password
    database: 'bluestock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Use promise for async/await support

// Signup Route
app.post('/signup', async (req, res) => {
    console.log("Received data:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        console.log("User inserted with ID:", result.insertId);
        res.status(201).json({ success: true, message: 'User created successfully' });
    } catch (error) {
        console.error("Error inserting data into database:", error);
        res.status(500).json({ success: false, message: 'Error inserting data into database' });
    }
});

// IPO Registration Route
app.post('/registerIpo', async (req, res) => {
    try {
        let {
            company_name, price_band, open_date, close_date, issue_size,
            issue_type, listing_date, status, ipo_price, listing_price,
            listing_gain, listed_date, current_market_price, current_return,
            rhp_link, drhp_link
        } = req.body;

        console.log("Received IPO data:", req.body);

        if (!company_name || !price_band || !issue_size || !issue_type || !status) {
            return res.status(400).json({ success: false, message: 'Missing required IPO fields' });
        }

        const sql = `
            INSERT INTO ipo_info (
                company_name, price_band, open_date, close_date, issue_size,
                issue_type, listing_date, status, ipo_price, listing_price,
                listing_gain, listed_date, current_market_price, current_return, 
                rhp_link, drhp_link
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            company_name, price_band, open_date, close_date, issue_size,
            issue_type, listing_date, status, ipo_price, listing_price,
            listing_gain, listed_date, current_market_price, current_return,
            rhp_link, drhp_link
        ];

        const [result] = await pool.execute(sql, values);
        console.log("IPO registered with ID:", result.insertId);

        res.status(201).json({ success: true, message: 'IPO Registered Successfully', ipoId: result.insertId });
    } catch (error) {
        console.error("Error registering IPO:", error);
        res.status(500).json({ success: false, message: 'Failed to register IPO' });
    }
});

// Fetch All IPOs
app.get('/registerIpo', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM ipo_info');

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No IPOs found' });
        }

        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error("Error fetching IPOs:", error);
        res.status(500).json({ success: false, message: 'Failed to retrieve IPO details' });
    }
});

// Delete IPO by ID
app.delete('/deleteIpo/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.execute('DELETE FROM ipo_info WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "IPO not found" });
        }

        res.json({ success: true, message: "IPO deleted successfully" });
    } catch (error) {
        console.error("Error deleting IPO:", error);
        res.status(500).json({ success: false, message: "Failed to delete IPO" });
    }
});

app.get('/ipo-stats', async (req, res) => {
    try {
        // Count total IPOs
        const [totalResult] = await pool.execute("SELECT COUNT(*) AS total_ipo FROM ipo_info");

        // Count gain IPOs (where listing_gain > 0)
        const [gainResult] = await pool.execute("SELECT COUNT(*) AS gain_ipo FROM ipo_info WHERE listing_gain > 0");

        // Count loss IPOs (where listing_gain < 0)
        const [lossResult] = await pool.execute("SELECT COUNT(*) AS loss_ipo FROM ipo_info WHERE listing_gain < 0");

        res.json({
            success: true,
            total_ipo: totalResult[0].total_ipo,
            gain_ipo: gainResult[0].gain_ipo,
            loss_ipo: lossResult[0].loss_ipo
        });
    } catch (error) {
        console.error('Error fetching IPO stats:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve IPO statistics' });
    }
});


// Gracefully Close the Connection Pool When the Server Stops
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log("MySQL pool closed.");
        process.exit();
    } catch (err) {
        console.error("Error closing MySQL pool:", err);
        process.exit(1);
    }
});

// Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
