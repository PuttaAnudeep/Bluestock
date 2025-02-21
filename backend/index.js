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
    password: 'root', // Replace with your MySQL password
    database: 'bluestock',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Use promise for async/await support

// Signup Route to Handle Form Submission
app.post('/signup', async (req, res) => {
    console.log("Received data:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Hash the password before saving to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user data into the database
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

// IPO Registration Route & Controller Combined
app.post('/registerIpo', async (req, res) => {
    try {
        // Destructure directly from req.body
        let {
            company_name, price_band, open_date, close_date, issue_size,
            issue_type, listing_date, status, ipo_price, listing_price,
            listing_gain, listed_date, current_market_price, current_return,
            rhp_link, drhp_link
        } = req.body;

        // Debug: Log received request body
        console.log("Received IPO data:", req.body);

        // Convert undefined values to null
        company_name = company_name || null;
        price_band = price_band || null;
        open_date = open_date || null;
        close_date = close_date || null;
        issue_size = issue_size || null;
        issue_type = issue_type || null;
        listing_date = listing_date || null;
        status = status || null;
        ipo_price = ipo_price || null;
        listing_price = listing_price || null;
        listing_gain = listing_gain || null;
        listed_date = listed_date || null;
        current_market_price = current_market_price || null;
        current_return = current_return || null;
        rhp_link = rhp_link || null;
        drhp_link = drhp_link || null;

        // Check for required fields
        if (!company_name || !price_band || !issue_size || !issue_type || !status) {
            return res.status(400).json({ success: false, message: 'Missing required IPO fields' });
        }

        // SQL Query
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

        // Execute Query
        const [result] = await pool.execute(sql, values);
        console.log("IPO registered with ID:", result.insertId);

        res.status(201).json({ message: 'IPO Registered Successfully', ipoId: result.insertId });

    } catch (error) {
        console.error("Error registering IPO:", error);
        res.status(500).json({ error: 'Failed to register IPO' });
    }
});
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
