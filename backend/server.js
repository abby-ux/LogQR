// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/index');  // Fix db path
const apiRoutes = require('./routes/api'); // Add this line

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());

// Connect API routes
app.use('/api', apiRoutes);

// test db connection on server start
db.testConnection();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// basic test route (fixed path)
app.get('/test', (req, res) => {  // Changed from 'post' to '/test'
    res.json({ message: 'Server is working' });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});