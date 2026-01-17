require('dotenv').config();
const express = require('express');
const app = express();
const apiRoutes = require('./routes/api');

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (req, res) => res.send('OK'));

module.exports = app;