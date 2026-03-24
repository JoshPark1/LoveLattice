const twilio = require('twilio');
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(message) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.log("Twilio credentials missing. logging message:", message);
        return;
    }

    try {
        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: process.env.USER_PHONE_NUMBER
        });
        console.log("SMS sent:", message);
    } catch (error) {
        console.error("Failed to send SMS:", error);
    }
}

module.exports = { sendSMS };
