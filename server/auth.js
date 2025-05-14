// Import required modules
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize router
const router = express.Router();

// Mock database (replace with actual DB integration)
const users = [];

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Admin-only user creation endpoint
router.post('/admin/users', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password_hash: hashedPassword });

    res.status(201).json({ message: 'User created successfully' });
});

// Login endpoint
router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Logout endpoint (stateless JWT, no action needed)
router.post('/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
