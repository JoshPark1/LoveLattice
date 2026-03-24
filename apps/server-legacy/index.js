const express = require('express');
const cors = require('cors');
const { sendSMS } = require('./notifier');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main SMS endpoint - This is the only endpoint the new Backend Server needs!
app.post('/api/send-sms', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message payload required' });

        // TODO: In the future, this is where you'd securely query the User Database 
        // to verify if the account is active and has enough credits before sending texts.
        
        await sendSMS(message);
        res.json({ success: true, message: 'SMS Dispatched' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Basic health check for Heroku / Render deployment
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
    console.log(`Thin Twilio API Server running on port ${PORT}`);
});
