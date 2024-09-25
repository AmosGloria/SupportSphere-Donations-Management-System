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
        const [result] = await pool.query('DELETE FROM Users WHERE user_id = ?', [id]);

        // Check if any row was affected
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user was deleted successfully
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error:', error);

        // Provide a more detailed error message if possible
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(500).json({ message: 'Database table not found' });
        } else if (error.code === 'ER_PARSE_ERROR') {
            res.status(500).json({ message: 'SQL syntax error' });
        } else {
            res.status(500).json({ message: 'Failed to delete user' });
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



// Endpoint for Admin and Donor to create a donation
app.post('/donations/create', authenticateJWT, async (req, res) => {
    const { role, user_id } = req.user;
    const { item_name, item_type, quantity, value, donation_date, community_name } = req.body;

    // Ensure the user is an admin or a donor
    if (role !== 'admin' && role !== 'donor') {
        return res.status(403).json({ message: 'Access denied. Only admins or donors can create donations.' });
    }

    try {
        // Fetch the community ID based on the provided community name
        const [communityResult] = await pool.query(
            'SELECT community_id FROM Communities WHERE community_name = ?',
            [community_name]
        );

        if (communityResult.length === 0) {
            return res.status(404).json({ message: 'Community not found' });
        }

        const community_id = communityResult[0].community_id;

        // Insert the new donation with the auto-generated donation_id, user_id, and community_id
        const [donationResult] = await pool.query(
            `INSERT INTO Donations (item_name, item_type, quantity, value, donation_date, user_id, community_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [item_name, item_type, quantity, value, donation_date, user_id, community_id]
        );

        res.status(201).json({ message: 'Donation created successfully', donationId: donationResult.insertId });
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ message: 'Failed to create donation' });
    }
});



// Endpoint for Admin to view all donations across all communities
app.get('/admin/donations', authenticateJWT, async (req, res) => {
    // Ensure the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        // Fetch all donations from the Donations table
        const [donations] = await pool.query('SELECT * FROM Donations');

        // Return the donations
        res.status(200).json(donations);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ message: 'Failed to fetch donations' });
    }
});



// Endpoint for Admin to update the status of a donation across all communities
app.patch('/admin/donations/:donationId/status', authenticateJWT, async (req, res) => {
    const { donationId } = req.params;
    const { status, quantity_received, quantity_remaining } = req.body;
    const { role } = req.user;

    // Ensure the authenticated user is an admin
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        // Update the status of the donation
        const [result] = await pool.query(
            'UPDATE Donations SET status = ?, remaining_quantity = ?, received_by_community_manager = 1 ' +
            'WHERE donation_id = ?',
            [status, quantity_remaining, donationId]
        );

        if (result.affectedRows > 0) {
            res.json({ message: 'Donation status updated successfully' });
        } else {
            res.status(404).json({ message: 'Donation not found' });
        }
    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({ message: 'Failed to update donation status' });
    }
});


// Endpoint for admin to delete a donation
app.delete('/admin/donations/:donationId', authenticateJWT, async (req, res) => {
    const { donationId } = req.params;
    const { role } = req.user;

    // Ensure the user is an admin
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        const [result] = await pool.query('DELETE FROM Donations WHERE donation_id = ?', [donationId]);

        if (result.affectedRows > 0) {
            res.json({ message: 'Donation deleted successfully' });
        } else {
            res.status(404).json({ message: 'Donation not found' });
        }
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({ message: 'Failed to delete donation' });
    }
});


//endpoint for admin to create a new community
app.post('/communities', authenticateJWT, async (req, res) => {
    const { community_name, location } = req.body;

    // Ensure the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        // Insert new community, auto-generate community_id
        const [result] = await pool.query(
            'INSERT INTO Communities (community_name, location) VALUES (?, ?)', 
            [community_name, location]
        );

        // Fetch the auto-generated community_id
        const community_id = result.insertId;

        res.status(201).json({ 
            message: 'Community created successfully', 
            community_id 
        });
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ message: 'Failed to create community' });
    }
});



// Endpoint to assign or reassign a community manager
app.patch('/communities/:communityId/assign-manager', authenticateJWT, async (req, res) => {
    let { communityId } = req.params;  // Fetch the communityId from request parameters
    const { manager_id } = req.body;   // Fetch the manager_id from the request body

    // Ensure the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    // Ensure communityId is a number
    communityId = parseInt(communityId, 10);

    try {
        // Update the community with the new manager
        const [result] = await pool.query('UPDATE Communities SET community_manager_id = ? WHERE community_id = ?', [manager_id, communityId]);

        if (result.affectedRows > 0) {
            res.json({ message: 'Community manager assigned successfully' });
        } else {
            res.status(404).json({ message: 'Community not found' });
        }
    } catch (error) {
        console.error('Error updating community manager:', error);
        res.status(500).json({ message: 'Failed to update community manager' });
    }
});



// Endpoint for admin to get all communities
app.get('/communities', authenticateJWT, async (req, res) => {
    // Ensure the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        // Fetch all communities with their details, including community_manager_id
        const [communities] = await pool.query(`
            SELECT Communities.community_id, Communities.community_name, Communities.location, 
                   Communities.community_manager_id, Users.name AS manager_name
            FROM Communities
            LEFT JOIN Users ON Communities.community_manager_id = Users.user_id
        `);

        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ message: 'Failed to fetch communities' });
    }
});




// Endpoint for admin to fetch community managers
app.get('/managers', authenticateJWT, async (req, res) => {
    // Ensure the authenticated user is an admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
    }

    try {
        // Fetch all users with the role 'community_manager'
        const [managers] = await pool.query('SELECT user_id, name FROM Users WHERE role = "community_manager"');

        res.status(200).json({ managers });
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ message: 'Failed to fetch managers' });
    }
});


// Endpoint for Community Manager to view all donations for their community
app.get('/community/donations', authenticateJWT, async (req, res) => {
    const { role, user_id } = req.user;

    // Ensure the authenticated user is a community manager
    if (role !== 'community_manager') {
        return res.status(403).json({ message: 'Access denied. Community managers only.' });
    }

    try {
        // Fetch the community ID for the logged-in community manager
        const [communityManager] = await pool.query(
            'SELECT community_id FROM Communities WHERE community_manager_id = ?', [user_id]
        );

        if (communityManager.length === 0) {
            return res.status(404).json({ message: 'Community not found for this manager.' });
        }

        const community_id = communityManager[0].community_id;

        // Fetch donations directed to the community of the logged-in manager
        const [donations] = await pool.query(
            'SELECT * FROM Donations WHERE community_id = ?', [community_id]
        );

        // Return donations filtered by the manager's community
        res.status(200).json(donations);
    } catch (error) {
        console.error('Error fetching donations for community manager:', error);
        res.status(500).json({ message: 'Failed to fetch donations for community' });
    }
});



// Endpoint for Community Manager to update the status of a donation
app.patch('/community/donations/:donationId/status', authenticateJWT, async (req, res) => {
    const { donationId } = req.params;
    const { status, quantity_received, quantity_remaining } = req.body;
    const { user_id } = req.user;

    // Ensure the authenticated user is a community manager
    if (req.user.role !== 'community_manager') {
        return res.status(403).json({ message: 'Access denied. Community managers only.' });
    }

    try {
        // Fetch the community ID for the logged-in community manager
        const [communityManager] = await pool.query(
            'SELECT community_id FROM Communities WHERE community_manager_id = ?', [user_id]
        );

        // Check if the community manager is assigned to a community
        if (communityManager.length === 0) {
            return res.status(404).json({ message: 'Community manager not assigned to any community' });
        }

        const community_id = communityManager[0].community_id;

        // Update the status of the donation, ensuring it belongs to the manager's community
        const [result] = await pool.query(
            'UPDATE Donations SET status = ?, remaining_quantity = ?, received_by_community_manager = 1 ' +
            'WHERE donation_id = ? AND community_id = ?',
            [status, quantity_remaining, donationId, community_id]
        );

        if (result.affectedRows > 0) {
            res.json({ message: 'Donation status updated successfully' });
        } else {
            res.status(404).json({ message: 'Donation not found or does not belong to your community' });
        }
    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({ message: 'Failed to update donation status' });
    }
});


// Endpoint for Donor to view their donation history
app.get('/donor/donations', authenticateJWT, async (req, res) => {
    const { user_id } = req.user; // Get the user ID from the authenticated user

    try {
        // Fetch donations made by the donor
        const [donations] = await pool.query(
            'SELECT * FROM Donations WHERE user_id = ?',
            [user_id]
        );

        // Return the donations history
        res.status(200).json(donations);
    } catch (error) {
        console.error('Error fetching donor donation history:', error);
        res.status(500).json({ message: 'Failed to fetch donation history' });
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
