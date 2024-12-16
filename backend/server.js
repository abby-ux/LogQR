// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/index');  // Fix db path
const apiRoutes = require('./routes/api'); // Add this line

const app = express();

app.use(cors());
app.use(express.json());

// Connect API routes
app.use('/auth', apiRoutes);

// test db connection on server start
db.testConnection();

// basic test route (fixed path)
app.get('/test', (req, res) => {  // Changed from 'post' to '/test'
    res.json({ message: 'Server is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});