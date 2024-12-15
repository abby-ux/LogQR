const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// test db connection on server start
db.testConnection();

// basic test route
app.get('post', (req, res) => {
    res.json({ message: 'Server is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port https://localhost:${PORT}`);
}); 