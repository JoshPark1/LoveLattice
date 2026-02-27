const { JSONFilePreset } = require('lowdb/node');
const defaultData = { trackedItems: [] };

// Initialize db
let db;

async function getDb() {
    if (!db) {
        db = await JSONFilePreset('db.json', defaultData);
    }
    return db;
}

async function getTrackedItems() {
    const db = await getDb();
    await db.read();
    return db.data.trackedItems;
}
const { downloadThumbnail, deleteThumbnail } = require('./utils');

async function addTrackedItem(item) {
    const db = await getDb();
    await db.read();
    const id = Date.now().toString();

    // Attempt to download thumbnail locally
    try {
        if (item.thumbnailUrl && item.thumbnailUrl.startsWith('http')) {
            const localThumb = await downloadThumbnail(item.thumbnailUrl, id);
            item.thumbnailUrl = localThumb;
        }
    } catch (e) {
        console.error("[ERROR] Failed to download thumbnail, keeping original URL:", e.message);
    }

    const newItem = { id, ...item, lastChecked: null, status: 'active' };
    db.data.trackedItems.push(newItem);
    await db.write();
    return newItem;
}

async function removeTrackedItem(id) {
    const db = await getDb();
    await db.read();
    db.data.trackedItems = db.data.trackedItems.filter(item => item.id !== id);
    await db.write();

    // Clean up filesystem so we don't leak space
    deleteThumbnail(id);

    return true;
}

module.exports = { getTrackedItems, addTrackedItem, removeTrackedItem };
