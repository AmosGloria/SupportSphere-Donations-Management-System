const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./database.js'); 
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8090;
const JWT_SECRET = process.env.JWT_SECRET;

// Enable CORS for all origins
app.use(cors());

// Use body-parser middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for authenticating JWT
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Create a nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send an email notification
const sendNotification = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Registration Route
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        await pool.query('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
});

// Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
    const user = rows[0];

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ user_id: user.user_id, role: user.role }, JWT_SECRET);
        res.json({ token });
    } else {
        res.sendStatus(401);
    }
});

// Get all Users
app.get('/users', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Users');
        res.json(rows);
    } catch (error) {
        res.sendStatus(500);
    }
});

// Endpoint to fetch the user role based on the user ID from the JWT token
app.get('/user/role', authenticateJWT, async (req, res) => {
    const { user_id } = req.user;

    try {
        const [rows] = await pool.query('SELECT role FROM Users WHERE user_id = ?', [user_id]);
        const user = rows[0];

        if (user) {
            res.json({ role: user.role });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Database query error:', error);
        res.sendStatus(500);
    }
});

// Endpoint to delete a user and reassign IDs
app.delete('/user/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        // Validate user ID format if needed
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Delete the user
        const [deleteResult] = await pool.query('DELETE FROM Users WHERE user_id = ?', [id]);

        if (deleteResult.affectedRows > 0) {
            // Reassign remaining user IDs
            const [users] = await pool.query('SELECT user_id FROM Users ORDER BY user_id');

            for (let i = 0; i < users.length; i++) {
                const newId = i + 1;
                if (users[i].user_id !== newId) {
                    await pool.query('UPDATE Users SET user_id = ? WHERE user_id = ?', [newId, users[i].user_id]);
                }
            }

            res.sendStatus(204); // No Content, successful deletion and reassignment
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error:', error);

        // Provide a more detailed error message if possible
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({ message: 'Database table not found' });
        } else if (error.code === 'ER_PARSE_ERROR') {
            res.status(500).json({ message: 'SQL syntax error' });
        } else {
            res.status(500).json({ message: 'Failed to delete user and reassign IDs' });
        }
    }
});

// Endpoint for Admin to Add a New User
app.post('/admin/add-user', authenticateJWT, async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Hash the user's password
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        // Insert the new user into the database
        await pool.query('INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);

        // Send success response
        res.status(201).json({ message: 'User added successfully' });
    } catch (error) {
        console.error('Error adding user:', error);
        res.status(500).json({ message: 'Failed to add user' });
    }
});

// Handle creating a new donation
app.post('/donations', authenticateJWT, async (req, res) => {
    const { item_name, item_type, value, quantity, community_id, donation_date, remaining_quantity, status } = req.body;
    const { user_id, role } = req.user;

    try {
        // Check if community_id is provided, otherwise set it to NULL
        const communityIdValue = community_id ? community_id : null;

        // Insert the donation into the database
        const [result] = await pool.query(
            'INSERT INTO Donations (item_name, item_type, value, quantity, user_id, community_id, donation_date, remaining_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
            [item_name, item_type, value, quantity, user_id, communityIdValue, donation_date, remaining_quantity, status]
        );
        const donation_id = result.insertId;

        // If donor, notify community manager
        if (role === 'donor') {
            const [communityManager] = await pool.query(
                'SELECT email FROM Users WHERE role = "community_manager"'
            );

            if (communityManager.length > 0) {
                const email = communityManager[0].email;
                await sendNotification(email, 'New Donation Assigned', `A new donation with ID ${donation_id} has been assigned to your community.`);
            }
        }

        res.status(201).send({ message: 'Donation created successfully!', donation_id });
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});

// Handle fetching donations
app.get('/donations', authenticateJWT, async (req, res) => {
    const { community_id } = req.query;
    const query = community_id ? 'SELECT * FROM Donations WHERE community_id = ?' : 'SELECT * FROM Donations';

    try {
        const [rows] = await pool.query(query, [community_id]);
        res.json(rows);
    } catch (error) {
        res.sendStatus(500);
    }
});

// Handle updating an existing donation
app.put('/donations/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { item_name, item_type, value, quantity, community_id, donation_date, remaining_quantity, status } = req.body;
    const { role } = req.user;

    try {
        await pool.query('UPDATE Donations SET item_name = ?, item_type = ?, value = ?, quantity = ?, community_id = ?, donation_date = ?, remaining_quantity = ?, status = ? WHERE donation_id = ?', 
            [item_name, item_type, value, quantity, community_id, donation_date, remaining_quantity, status, id]
        );

        if (role === 'community_manager' && status === 'Received') {
            const [donor] = await pool.query('SELECT email FROM Users WHERE user_id = (SELECT user_id FROM Donations WHERE donation_id = ?)', [id]);
            if (donor.length > 0) {
                await sendNotification(donor[0].email, 'Donation Status Updated', `Your donation with ID ${id} has been received.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

// Handle deleting a donation
app.delete('/donations/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM Donations WHERE donation_id = ?', [id]);
        res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
