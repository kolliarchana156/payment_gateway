const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

app.get('/checkout.js', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../sdk/dist/checkout.js'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// --- THE FIXED PROXY ROUTE ---
app.post('/pay', async (req, res) => {
    try {
        console.log('💰 Received payment request:', req.body);

        // FIX: Added "/api/v1" to match your API's expected path
        const apiResponse = await fetch('http://gateway_api:8000/api/v1/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await apiResponse.json();
        console.log('✅ API Response:', data);

        if (!apiResponse.ok) {
            throw new Error(`API Error: ${apiResponse.status}`);
        }

        res.status(apiResponse.status).json(data);

    } catch (error) {
        console.error('❌ Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(3001, () => {
    console.log('Frontend running on port 3001');
});