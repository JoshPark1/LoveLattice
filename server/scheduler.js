const cron = require('node-cron');
const { getTrackedItems } = require('./db');
const { getPostMetadata, getHighlightMetadata } = require('./instagram');
const { sendSMS } = require('./notifier');

// Helper to delay (random 0-30 mins)
const randomDelay = (ms) => new Promise(resolve => setTimeout(resolve, Math.random() * ms));

async function checkItem(item) {
    console.log(`Checking item: ${item.note || item.url}`);

    let currentData = [];
    try {
        if (item.url.includes('/p/') || item.url.includes('/reel/')) {
            // It's a post (carousel or single)
            currentData = await getPostMetadata(item.url);
        } else if (item.url.includes('/s/') || item.url.includes('/stories/')) {
            // Highlight story
            currentData = await getHighlightMetadata(item.url);
        } else {
            console.error(`[WARN] Unknown URL format: ${item.url}`);
            return;
        }

        // verification
        const exists = currentData.find(media => media.id === item.targetMediaId);

        if (!exists) {
            console.log(`ALARM: Media ${item.targetMediaId} missing from ${item.url}`);
            await sendSMS(`ALERT: The photo/video you are tracking from ${item.note || 'Instagram'} seems to be missing! URL: ${item.url}`);
            // Update status in DB?
            // TODO: update item status to 'missing'
        } else {
            console.log(`Verified: ${item.targetMediaId} is still there.`);
        }

    } catch (e) {
        console.error(`Error checking item ${item.url}:`, e);
        // Don't alert on error immediately, could be transient
    }
}

function startDailyCheck() {
    // Schedule to run every day at 9:00 AM
    // 0 9 * * *
    cron.schedule('0 9 * * *', async () => {
        console.log("Running daily check...");

        // Random start delay to mask automation
        console.log("Waiting for random delay...");
        await randomDelay(30 * 60 * 1000); // 0-30 mins

        const items = await getTrackedItems();
        for (const item of items) {
            await checkItem(item);
            // Random delay between items
            await randomDelay(60 * 1000); // 0-60s
        }
    });
}

async function runManualCheck() {
    console.log("Running manual check...");
    const items = await getTrackedItems();
    for (const item of items) {
        await checkItem(item);
        // Small delay between items to avoid spamming
        await randomDelay(2000);
    }
}

module.exports = { startDailyCheck, runManualCheck };
