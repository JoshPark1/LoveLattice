const { JSONFilePreset } = require('lowdb/node');
const { deleteThumbnail, downloadThumbnail } = require('./utils');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const defaultData = { accounts: [], storyLogs: [] };

let db;

async function getDb() {
    if (!db) {
        db = await JSONFilePreset(DB_PATH, defaultData);

        // Ensure accounts and storyLogs arrays always exist
        if (!db.data.accounts) db.data.accounts = [];
        if (!db.data.storyLogs) db.data.storyLogs = [];

        // Automatic Migration: from old `trackedItems` to new `accounts` array
        if (db.data.trackedItems) {
            console.log("Migrating older trackedItems schema to accounts schema...");
            const tempItems = db.data.trackedItems;

            if (!db.data.accounts) db.data.accounts = [];
            if (!db.data.storyLogs) db.data.storyLogs = [];

            // Group all old items under a dummy account to avoid losing data
            if (tempItems.length > 0) {
                const dummyAccount = {
                    id: Date.now().toString(),
                    username: "legacy_imports",
                    note: "Imported from Old Config",
                    trackedPosts: tempItems, // Move old shape items inside
                    storyConfig: {
                        enabled: false,
                        targetTags: [],
                        referenceFaceUrl: null
                    }
                };
                db.data.accounts.push(dummyAccount);
            }

            delete db.data.trackedItems;
            await db.write();
        }
    }
    return db;
}

async function getAccounts() {
    const db = await getDb();
    await db.read();
    return db.data.accounts;
}

async function addAccount({ username, note }) {
    const db = await getDb();
    await db.read();
    const id = Date.now().toString();

    console.log("DB DATA BEFORE ADDING ACCOUNT:", db.data);

    const newAccount = {
        id,
        username: username || "unknown",
        note: note || "",
        trackedPosts: [],
        storyConfig: {
            enabled: false,
            targetTags: [],
            referenceFaceUrl: null
        }
    };
    db.data.accounts.push(newAccount);
    await db.write();
    return newAccount;
}

// Update account replaces the old account with the updated one
async function updateAccount(id, updatedAccountData) {
    const db = await getDb();
    await db.read();

    const idx = db.data.accounts.findIndex(acc => acc.id === id);
    if (idx === -1) throw new Error("Account not found");

    // Important: if there's a new post being added with a raw thumbnail URL, download it
    for (const post of updatedAccountData.trackedPosts || []) {
        // Ensure post has an ID
        if (!post.id) post.id = Date.now().toString() + Math.floor(Math.random() * 1000);
        if (post.thumbnailUrl && post.thumbnailUrl.startsWith('http')) {
            try {
                const localThumb = await downloadThumbnail(post.thumbnailUrl, post.id);
                post.thumbnailUrl = localThumb;
            } catch (e) {
                console.error("[ERROR] Failed to download thumbnail for post:", e.message);
            }
        }
    }

    // Merge changes
    const existing = db.data.accounts[idx];

    // Find removed posts and delete their thumbnails
    if (existing.trackedPosts && updatedAccountData.trackedPosts) {
        const newPostIds = updatedAccountData.trackedPosts.map(p => p.id);
        for (const oldPost of existing.trackedPosts) {
            if (!newPostIds.includes(oldPost.id)) {
                if (oldPost.thumbnailUrl && oldPost.thumbnailUrl.startsWith('/thumbnails/')) {
                    const filename = oldPost.thumbnailUrl.split('/').pop();
                    const thumbPath = path.join(__dirname, 'public', 'thumbnails', filename);
                    if (fs.existsSync(thumbPath)) {
                        fs.unlinkSync(thumbPath);
                        console.log(`[DEBUG] Deleted old post thumbnail: ${thumbPath}`);
                    }
                }
            }
        }
    }

    // Check if reference face changed from existing
    if (existing.storyConfig && updatedAccountData.storyConfig && existing.storyConfig.referenceFaceUrl && existing.storyConfig.referenceFaceUrl !== updatedAccountData.storyConfig.referenceFaceUrl) {
        // Optional: Clean up old uploaded face file if it exists and changed
        try {
            const oldPath = path.join(__dirname, 'uploads', existing.storyConfig.referenceFaceUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        } catch (e) { }
    }

    db.data.accounts[idx] = { ...existing, ...updatedAccountData };
    await db.write();
    return db.data.accounts[idx];
}

async function removeAccount(id) {
    const db = await getDb();
    await db.read();

    const account = db.data.accounts.find(a => a.id === id);
    if (account) {
        // Clean up thumbnails
        for (const post of account.trackedPosts || []) {
            if (post.thumbnailUrl && post.thumbnailUrl.startsWith('/thumbnails/')) {
                const filename = post.thumbnailUrl.split('/').pop();
                const thumbPath = path.join(__dirname, 'public', 'thumbnails', filename);
                if (fs.existsSync(thumbPath)) {
                    fs.unlinkSync(thumbPath);
                    console.log(`[DEBUG] Deleted old account's thumbnail: ${thumbPath}`);
                }
            }
        }
        // Clean up face photo
        if (account.storyConfig && account.storyConfig.referenceFaceUrl) {
            try {
                const oldPath = path.join(__dirname, 'uploads', account.storyConfig.referenceFaceUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            } catch (e) { }
        }
    }

    db.data.accounts = db.data.accounts.filter(acc => acc.id !== id);
    await db.write();
    return true;
}

async function getStoryLogs() {
    const db = await getDb();
    await db.read();
    return db.data.storyLogs || [];
}

async function addStoryLog(logData) {
    const db = await getDb();
    await db.read();

    // Dedup: skip if the same account already logged a match for this story within the last 24h
    // Use storyId (stable Instagram ID) as the key — CDN thumbnail URLs change each scan
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const alreadyLogged = db.data.storyLogs.some(log =>
        log.accountId === logData.accountId &&
        new Date(log.timestamp).getTime() > oneDayAgo &&
        (logData.storyId
            ? log.storyId === logData.storyId
            : log.storyThumbnail === logData.storyThumbnail)
    );
    if (alreadyLogged) {
        console.log(`[DB] Skipping duplicate story log for account ${logData.accountId} (same story already logged within 24h)`);
        return null;
    }

    db.data.storyLogs.unshift({ id: Date.now().toString(), timestamp: new Date().toISOString(), ...logData });
    // Keep only last 100 logs
    if (db.data.storyLogs.length > 100) {
        db.data.storyLogs = db.data.storyLogs.slice(0, 100);
    }
    await db.write();
    return db.data.storyLogs[0];
}

async function deleteStoryLog(id) {
    const db = await getDb();
    await db.read();

    const log = db.data.storyLogs.find(l => l.id === id);
    if (!log) throw new Error('Story log not found');

    // Delete the locally downloaded thumbnail if it exists
    if (log.storyThumbnail && log.storyThumbnail.startsWith('/thumbnails/')) {
        const filename = log.storyThumbnail.split('/').pop();
        const thumbPath = path.join(__dirname, 'public', 'thumbnails', filename);
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
            console.log(`[DB] Deleted story log thumbnail: ${thumbPath}`);
        }
    }

    db.data.storyLogs = db.data.storyLogs.filter(l => l.id !== id);
    await db.write();
    return true;
}

module.exports = {
    getAccounts,
    addAccount,
    updateAccount,
    removeAccount,
    getStoryLogs,
    addStoryLog,
    deleteStoryLog
};
