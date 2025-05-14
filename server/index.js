// Import required modules
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

const authRoutes = require('./auth');

// Routes
app.use('/api', authRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Backend is running');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
