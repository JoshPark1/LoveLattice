const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { getDataDir } = require('./paths');
const { getAccounts, addStoryLog } = require('./db');
const { getPostMetadata, getHighlightMetadata, getUserStories, downloadStoryImage } = require('./instagram');
async function sendSMS(message) {
    try {
        await fetch('http://localhost:3001/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
    } catch(e) {
        console.error("[SMS ERROR] Could not reach backend server:", e);
    }
}
const { compareFaces } = require('./faceRecognition');

const randomDelay = (ms) => new Promise(resolve => setTimeout(resolve, Math.random() * ms));

async function checkAccount(account) {
    console.log(`Checking account: ${account.username} (${account.note})`);

    // 1. Check Tracked Posts
    for (const post of account.trackedPosts || []) {
        try {
            let currentData = [];
            if (post.url.includes('/p/') || post.url.includes('/reel/')) {
                currentData = await getPostMetadata(post.url);
            } else if (post.url.includes('/s/') || post.url.includes('/stories/')) {
                currentData = await getHighlightMetadata(post.url);
            } else {
                console.error(`[WARN] Unknown URL format: ${post.url}`);
                continue;
            }

            const exists = currentData.find(media => media.id === post.targetMediaId);

            if (!exists) {
                console.log(`ALARM: Media ${post.targetMediaId} missing from ${post.url}`);
                await sendSMS(`Alert for @${account.username} (${account.note}): Tracked post (${post.note}) is missing! URL: ${post.url}`);
                // TODO: update post status to 'missing'
            } else {
                console.log(`Verified: Post media ${post.targetMediaId} is still there.`);
            }
        } catch (e) {
            console.error(`Error checking post ${post.url}:`, e);
        }
    }

    // 2. Check Active Stories
    if (account.storyConfig && account.storyConfig.enabled) {
        try {
            console.log(`Fetching active stories for ${account.username}`);
            // Wait to scatter network requests
            await randomDelay(5000);

            const stories = await getUserStories(account.username);

            for (const story of stories) {
                let matchedReason = null;

                // Compare Tags/Mentions
                // Normalize both sides: strip leading @ so "@thejuicymelon" matches "thejuicymelon"
                const tagsToCheck = (account.storyConfig.targetTags || []).map(t => t.replace(/^@/, '').toLowerCase());
                const storyTags = (story.tags || []).map(t => t.replace(/^@/, '').toLowerCase());
                const matchedTags = storyTags.filter(t => tagsToCheck.includes(t));
                if (matchedTags.length > 0) {
                    matchedReason = `Tag matched: ${matchedTags.join(', ')}`;
                }

                // Compare Face if image provided and no reason found yet
                let savedLocalPath = null;
                if (!matchedReason && account.storyConfig.referenceFaceUrl && story.type === 'image') {
                    // story.localPath is downloaded inside the IG browser session (CDN URLs are session-scoped)
                    const localPath = story.localPath;
                    if (localPath) {
                        console.log(`Comparing face for story (local: ${localPath})`);
                        // referenceFaceUrl is stored as just a filename — resolve to full path
                        let refFacePath = account.storyConfig.referenceFaceUrl;
                        if (refFacePath && !refFacePath.startsWith('http') && !path.isAbsolute(refFacePath)) {
                            refFacePath = path.join(getDataDir(), 'uploads', refFacePath);
                        }
                        const result = await compareFaces(refFacePath, localPath).catch(e => ({ match: false, error: e.message }));
                        console.log(`Face comparison result:`, JSON.stringify(result));
                        if (result.match) {
                            matchedReason = `Face match detected (dist: ${result.distance.toFixed(2)})`;
                            // Move to thumbnails so the dashboard can show it permanently
                            const keepPath = path.join(getDataDir(), 'thumbnails', `story_match_${Date.now()}.jpg`);
                            try { fs.renameSync(localPath, keepPath); savedLocalPath = `/thumbnails/${path.basename(keepPath)}`; } catch (_) {}
                        } else {
                            // No match — delete the temp file
                            try { fs.unlinkSync(localPath); } catch (_) {}
                        }
                    } else {
                        console.log('[SCHEDULER] No local story image available for face check (download may have failed).');
                    }
                }

                // If match found, log and alert
                if (matchedReason) {
                    console.log(`Story match for ${account.username}:`, matchedReason);

                    // For tag matches the face block was skipped, but we still have a temp
                    // download — move it to permanent thumbnails so the dashboard can show
                    // it without hitting Instagram's CDN.
                    if (story.localPath && !savedLocalPath) {
                        const keepPath = path.join(getDataDir(), 'thumbnails', `story_match_${Date.now()}.jpg`);
                        try { fs.renameSync(story.localPath, keepPath); savedLocalPath = `/thumbnails/${path.basename(keepPath)}`; } catch (_) {}
                    }

                    await addStoryLog({
                        accountId: account.id,
                        username: account.username,
                        storyId: story.id,
                        storyThumbnail: savedLocalPath || story.thumbnail || story.url,
                        reason: matchedReason,
                        timestamp: story.timestamp || new Date().toISOString()
                    });

                    // Only send SMS if the user wants text notifications
                    if (account.storyConfig.notify !== false) {
                        await sendSMS(`Alert for @${account.username} (${account.note}): Detected target in latest story! Reason: ${matchedReason}. Check logs dashboard.`);
                    }
                } else {
                    // No match at all — clean up any temp download
                    if (story.localPath) {
                        try { fs.unlinkSync(story.localPath); } catch (_) {}
                    }
                }

            }
        } catch (e) {
            console.error(`Error checking stories for ${account.username}:`, e);
        }
    }
}

const LAST_SCAN_FILE = path.join(getDataDir(), 'last_scan.json');
const MISSED_SCAN_THRESHOLD_MS = 23 * 60 * 60 * 1000; // 23 hours

function getLastScanTime() {
    try {
        const data = JSON.parse(fs.readFileSync(LAST_SCAN_FILE, 'utf8'));
        return data.lastScanAt ? new Date(data.lastScanAt) : null;
    } catch (_) {
        return null;
    }
}

function saveLastScanTime() {
    try {
        fs.mkdirSync(path.dirname(LAST_SCAN_FILE), { recursive: true });
        fs.writeFileSync(LAST_SCAN_FILE, JSON.stringify({ lastScanAt: new Date().toISOString() }));
    } catch (e) {
        console.error('[SCHEDULER] Could not save last scan time:', e);
    }
}

async function runDailyCheck() {
    console.log("Running daily check...");
    const accounts = await getAccounts();
    for (const account of accounts) {
        await checkAccount(account);
        await randomDelay(60 * 1000); // 0-60s
    }
    saveLastScanTime();
}

function startDailyCheck() {
    // On startup, check if we missed a scan while the laptop was closed
    const lastScan = getLastScanTime();
    const now = new Date();
    const msSinceLast = lastScan ? (now - lastScan) : Infinity;

    if (msSinceLast > MISSED_SCAN_THRESHOLD_MS) {
        const lastScanStr = lastScan ? lastScan.toLocaleString() : 'never';
        console.log(`[SCHEDULER] Missed scan detected (last scan: ${lastScanStr}). Running catch-up scan now.`);
        // Small delay so the app finishes initialising before we hit the network
        setTimeout(() => runDailyCheck(), 5000);
    }

    // Schedule the normal daily scan at 9am
    cron.schedule('0 9 * * *', async () => {
        await randomDelay(30 * 60 * 1000); // 0-30 mins jitter
        await runDailyCheck();
    });
}

async function runManualCheck() {
    console.log("Running manual check...");
    const accounts = await getAccounts();
    for (const account of accounts) {
        await checkAccount(account);
        await randomDelay(2000);
    }
    saveLastScanTime();
}

module.exports = { startDailyCheck, runManualCheck };
