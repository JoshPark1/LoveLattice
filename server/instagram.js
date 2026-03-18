const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');

const AUTH_FILE = path.join(__dirname, 'storageState.json');

// Helper: Random integer between min and max
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: Sleep for random amount of time
const sleep = (min, max) => new Promise(r => setTimeout(r, randomInt(min, max)));

async function simulateHumanBehavior(page) {
    // 1. Random Mouse Movements
    await page.mouse.move(randomInt(100, 500), randomInt(100, 500));
    await sleep(500, 1500);

    // 2. Random Scrolling
    // Scroll down a bit
    await page.mouse.wheel(0, randomInt(300, 800));
    await sleep(1000, 3000);

    // Scroll up a tiny bit (simulating reading/re-adjusting)
    if (Math.random() > 0.5) {
        await page.mouse.wheel(0, -randomInt(50, 200));
        await sleep(500, 1500);
    }
}

async function interactWithUI(page) {
    try {
        // 1. Check for "more" button on caption and click it sometimes
        const moreButton = await page.$('div[role="button"]:has-text("more")');
        if (moreButton && Math.random() > 0.3) {
            await moreButton.click();
            await sleep(500, 1000);
        }

        // 2. Check for Carousel "Next" arrow and click it
        const nextButton = await page.$('button[aria-label="Next"]');
        if (nextButton && Math.random() > 0.2) {
            // Click it 1-3 times
            const clicks = randomInt(1, 3);
            for (let i = 0; i < clicks; i++) {
                await nextButton.click();
                await sleep(1000, 2000);
            }
        }
    } catch (e) {
        // Ignore interaction errors
    }
}

async function getBrowserContext() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        storageState: fs.existsSync(AUTH_FILE) ? AUTH_FILE : undefined,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
    });
    return { browser, context };
}

async function login({ headless = false } = {}) {
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();

    try {
        await page.goto('https://www.instagram.com/');

        try {
            await page.waitForSelector('svg[aria-label="Home"], img[alt$="profile picture"]', { timeout: 5000 });
            console.log("Already logged in.");
        } catch (e) {
            console.log("Not logged in. Waiting for user input in the browser window...");
            await page.waitForSelector('svg[aria-label="Home"]', { timeout: 0 });
            await context.storageState({ path: AUTH_FILE });
            console.log("Session saved to", AUTH_FILE);
        }
    } catch (error) {
        console.error("Login failed or cancelled:", error);
    } finally {
        await browser.close();
    }
}

async function getPostMetadata(url) {
    console.log(`Fetching metadata for: ${url}`);
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    const items = [];
    const capturedImages = new Set(); // Packet/Image capture buffer

    try {
        let postData = null;

        // Setup listener for the data response
        const responsePromise = page.waitForResponse(async response => {
            const u = response.url();

            // 1. Capture Image Packets (User Suggestion)
            if (u.includes('cdninstagram.com') && (u.includes('.jpg') || u.includes('.webp'))) {
                // Check if it's a significant image (not a tiny thumb)
                if (!u.includes('s150x150') && !u.includes('p50x50')) {
                    capturedImages.add(u);
                }
            }



            if (response.status() !== 200) return false;

            // Broader filter for debugging: Catch almost everything from IG that isn't static assets
            if (u.includes('instagram.com') && !u.includes('.css') && !u.includes('.js') && !u.includes('.png')) {
                try {
                    const text = await response.text();
                    // Handle "for(;;);" prefix if present
                    const jsonStr = text.startsWith('for (;;);') ? text.slice(9) : text;
                    const json = JSON.parse(jsonStr);



                    // Check for our target data
                    if (json.data && json.data.xdt_shortcode_media) {
                        return true;
                    }

                    // NEW: Check specifically for Media Info endpoint (common for permalinks)
                    if (u.includes('/api/v1/media/') || u.includes('/info/')) {
                        if (json.items && json.items[0]) {
                            return true;
                        }
                    }

                    if (json.data && json.data.xdt_api__v1__feed__timeline__connection) {
                        const edges = json.data.xdt_api__v1__feed__timeline__connection.edges;
                        if (edges && edges.length > 0) {
                            for (const edge of edges) {
                                const node = edge.node;
                                if (node) {
                                    if (node.media || node.carousel_media || node.image_versions2) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }

                    if (json.items && json.items[0]) {
                        return true;
                    }
                } catch (e) {
                    // Ignore non-JSON responses
                }
            }
            return false;
        }, { timeout: 30000 }).catch(() => null);

        await page.goto(url);

        // Wait for load + Random initial delay
        await page.waitForLoadState('domcontentloaded');
        await sleep(2000, 5000);

        // Simulate reading the post
        await simulateHumanBehavior(page);
        await interactWithUI(page);

        // Check for login redirect
        if (page.url().includes('login')) {
            console.log("Redirected to login page. Please login first.");
        }

        // Check if we captured the data during navigation
        let response = await responsePromise;

        if (response && !postData) {
            // Already handled by network intercept?
        }

        // NEW: Robust Script Tag Extraction (Primary Method since XHR is blocked)
        if (!postData) {
            try {
                const scriptData = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    for (const s of scripts) {
                        const content = s.textContent;
                        if (content && (
                            content.includes('xdt_api__v1__media__shortcode__web_info') ||
                            content.includes('xdt_shortcode_media')
                        )) {
                            return content;
                        }
                    }
                    return null;
                });

                if (scriptData) {
                    // Extract the JSON blob cleanly
                    // The format is usually inside `ScheduledServerJS` or `RelayPrefetchedStreamCache`
                    // We look for the specific key and try to grab the object around it.

                    // Regex to find the key and capturing the value block is hard due to nesting.
                    // Instead, let's find the start and pseudo-parse or use a broader match.

                    // Strategy: Find the key, then find the surrounding JSON structure
                    // The log shows: "xdt_api__v1__media__shortcode__web_info":{"items":[...]}

                    // 1. Try to find the specific interesting object directly
                    const key = '"xdt_api__v1__media__shortcode__web_info"';
                    const idx = scriptData.indexOf(key);

                    if (idx !== -1) {
                        // We found the key. Now we need to extract the valid JSON object following it.
                        // This is tricky without a full parser, but we can try to find the parent object 
                        // or just parse the whole thing if it's a clean JSON line (it's often not).

                        // Hacky but often effective: 
                        // 1. Cut the string starting from the key
                        // 2. Walk forward to find the matching closing brace for the value object

                        let openBraces = 0;
                        let startIndex = idx + key.length;
                        // Move past colon
                        while (scriptData[startIndex] !== '{' && startIndex < scriptData.length) startIndex++;

                        let endIndex = startIndex;
                        for (let i = startIndex; i < scriptData.length; i++) {
                            if (scriptData[i] === '{') openBraces++;
                            if (scriptData[i] === '}') openBraces--;

                            if (openBraces === 0) {
                                endIndex = i + 1;
                                break;
                            }
                        }

                        const jsonString = scriptData.substring(startIndex, endIndex);
                        try {
                            const parsed = JSON.parse(jsonString);
                            if (parsed.items) {
                                postData = parsed.items[0]; // The first item is the post itself
                            }
                        } catch (e) {
                        }
                    }
                }
            } catch (e) {
                console.log("Script tag scanning failed:", e);
            }
        }


        if (response && !postData) {
            try {
                const text = await response.text();
                const jsonStr = text.startsWith('for (;;);') ? text.slice(9) : text;
                const json = JSON.parse(jsonStr);

                if (json.data && json.data.xdt_shortcode_media) {
                    postData = json.data.xdt_shortcode_media;
                } else if (json.data && json.data.xdt_api__v1__feed__timeline__connection) {
                    // Extract from timeline
                    const edges = json.data.xdt_api__v1__feed__timeline__connection.edges;
                    if (edges && edges.length > 0) {
                        // Iterate edges to find the valid post data
                        for (const edge of edges) {
                            const node = edge.node;
                            if (node) {
                                if (node.media || node.carousel_media || node.image_versions2) {
                                    postData = node;
                                    break;
                                }
                            }
                        }
                    }
                } else if (json.items && json.items[0]) {
                    postData = json.items[0];
                }
            } catch (e) {
            }
        }

        if (postData) {
            // Safety check: ensure we didn't end up with a wrapper with null media
            if (postData.media) {
                postData = postData.media;
            } else if (postData.media === null && !postData.carousel_media && !postData.image_versions2) {
                // Try to recover if we have a wrapper but no media? 
                // Actually the loop above should have prevented this, unless NO valid edge was found.
                // In that case postData would be null (if we init it to null) or the last edge? 
                // Wait, in the loop 'postData' is assigned only on match. 
                // But wait, 'let postData = null' was defined at top.
                // If loop doesn't find anything, postData is null.
                // But previously I was assigning edges[0].node.
            }

            console.log("Captured Post Data from Network!");

            // Logic to distinguish between Sidecar (Standard) and Carousel (Feed/Reels)
            let children = null;
            if (postData.edge_sidecar_to_children && postData.edge_sidecar_to_children.edges) {
                children = postData.edge_sidecar_to_children.edges; // Array of { node: ... }
            } else if (postData.carousel_media) {
                children = postData.carousel_media; // Array of { id: ... } (Direct items)
            }

            if (children) {
                children.forEach((child, index) => {
                    // Unify item structure
                    const node = child.node || child;

                    items.push({
                        id: node.id || node.pk,
                        url: node.display_url || (node.image_versions2 ? node.image_versions2.candidates[0].url : ''),
                        type: (node.is_video || node.media_type === 2) ? 'video' : 'image',
                        thumbnail: node.display_resources ? node.display_resources[0].src : (node.image_versions2 ? node.image_versions2.candidates[0].url : node.display_url),
                        index: index
                    });
                });
            } else {
                items.push({
                    id: postData.id || postData.pk,
                    url: postData.display_url || (postData.image_versions2 ? postData.image_versions2.candidates[0].url : ''),
                    type: (postData.is_video || postData.media_type === 2) ? 'video' : 'image',
                    thumbnail: postData.display_resources ? postData.display_resources[0].src : (postData.image_versions2 ? postData.image_versions2.candidates[0].url : postData.display_url),
                    index: 0
                });
            }
        } else {
            console.log("Network intercept failed. Cannot track specific items without Metadata IDs.");
        }

    } catch (e) {
        console.error("Error fetching post:", e);
    } finally {
        await browser.close();
    }
    return items;
}

async function getHighlightMetadata(url) {
    console.log(`Fetching highlight metadata for: ${url}`);
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    const items = [];

    try {
        // Setup capture
        // Setup capture
        let reelData = null;
        const responsePromise = page.waitForResponse(async response => {
            const u = response.url();
            if (response.status() !== 200) return false;

            if (u.includes('/api/v1/feed/reels_media/') || u.includes('graphql')) {
                try {
                    const json = await response.json();
                    if (json.reels || json.reels_media) {
                        // We found the highlights data
                        return true;
                    }
                } catch (e) { }
            }
            return false;
        }, { timeout: 10000 }).catch(() => null);

        await page.goto(url);
        await page.waitForLoadState('domcontentloaded');
        await sleep(2000, 4000);

        await simulateHumanBehavior(page);

        if (page.url().includes('login')) {
            console.log("Redirected to login. Highlights require login.");
            await browser.close();
            return [];
        }

        const response = await responsePromise;
        if (response) {
            try {
                const json = await response.json();
                if (json.reels || json.reels_media) {
                    const reels = json.reels || json.reels_media;
                    const reelId = Object.keys(reels)[0];
                    if (reelId) reelData = reels[reelId];
                }
            } catch (e) { }
        }

        if (!reelData) {
            try {
                const scriptData = await page.evaluate(() => {
                    const scripts = Array.from(document.querySelectorAll('script'));
                    for (const s of scripts) {
                        const content = s.textContent;
                        if (content && content.includes('xdt_api__v1__feed__reels_media__connection')) {
                            return { type: 'reels_media', content };
                        }
                    }
                    return null;
                });

                if (scriptData) {
                    let contentToParse = scriptData.content;
                    const keyString = 'xdt_api__v1__feed__reels_media__connection';
                    const idx = contentToParse.indexOf(keyString);

                    if (idx !== -1) {
                        let openBraces = 0;
                        let startIndex = idx + keyString.length;
                        while (contentToParse[startIndex] !== '{' && startIndex < contentToParse.length) startIndex++;

                        let endIndex = startIndex;
                        for (let i = startIndex; i < contentToParse.length; i++) {
                            if (contentToParse[i] === '{') openBraces++;
                            if (contentToParse[i] === '}') openBraces--;
                            if (openBraces === 0) {
                                endIndex = i + 1;
                                break;
                            }
                        }

                        const jsonString = contentToParse.substring(startIndex, endIndex);
                        if (jsonString) {
                            try {
                                const parsed = JSON.parse(jsonString);
                                if (parsed.edges && parsed.edges.length > 0) {
                                    reelData = parsed.edges[0].node;
                                }
                            } catch (e) { }
                        }
                    } else if (contentToParse.includes('xdt_api__v1__feed__timeline__connection')) {
                        // Sometimes reels are returned as timeline connections? Play it safe.
                    }
                }
            } catch (e) { }
        }

        if (reelData && reelData.items) {
            reelData.items.forEach((item) => {
                items.push({
                    id: item.pk,
                    url: item.image_versions2 ? item.image_versions2.candidates[0].url : '',
                    type: item.media_type === 2 ? 'video' : 'image',
                    thumbnail: item.image_versions2 ? item.image_versions2.candidates[0].url : '',
                    timestamp: item.taken_at
                });
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
    return items;
}

/**
 * Extracts tagged/mentioned usernames from a story item's metadata.
 * Covers:
 *  1. story_bloks_stickers — Instagram's current sticker format, covers both
 *     @mention stickers (bloks_sticker_type: "mention") and
 *     reshares (display_type: "mention_reshare")
 *     Username is at: bloks_sticker.sticker_data.ig_mention.username
 *  2. Legacy fields: reel_mentions, story_feed_media, usertags
 */
function extractTagsFromItem(item) {
    const tags = new Set();

    try {
        // 1. story_bloks_stickers — the current Instagram API format
        //    Covers @mention stickers AND "mention_reshare" (reposts)
        const bloksStickers = item.story_bloks_stickers || [];
        for (const sticker of bloksStickers) {
            const username = sticker?.bloks_sticker?.sticker_data?.ig_mention?.username;
            if (username) tags.add(username);
        }

        // 2. Legacy: reel_mentions / story_mentions
        const mentions = item.reel_mentions || item.story_mentions || [];
        for (const m of mentions) {
            if (m.user && m.user.username) tags.add(m.user.username);
        }

        // 3. Legacy: story_feed_media reshares
        const reshare = item.story_feed_media || [];
        for (const r of reshare) {
            if (r.feed_media?.user?.username) tags.add(r.feed_media.user.username);
        }

        // 4. User tags in the media
        const usertags = item.usertags?.in || [];
        for (const ut of usertags) {
            if (ut.user?.username) tags.add(ut.user.username);
        }
    } catch (e) {
        // Don't crash story scanning if tag extraction fails
    }

    return Array.from(tags);
}

async function getUserStories(username) {
    console.log(`Fetching active stories for: ${username}`);
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    let storyItems = [];

    try {
        console.log(`Navigating to profile to fetch stories for ${username}`);

        await page.goto(`https://www.instagram.com/${username}/`);
        await page.waitForLoadState('domcontentloaded');
        await sleep(2000, 4000);

        if (page.url().includes('login')) {
            console.log("Redirected to login. Stories require login.");
            await browser.close();
            return [];
        }

        let userId = null;
        try {
            // Use web_profile_info API — reliably returns the VIEWED profile's ID, not the logged-in user's
            userId = await page.evaluate(async (uname) => {
                try {
                    let csrf = '';
                    const match = document.cookie.match(/csrftoken=([^;]+)/);
                    if (match) csrf = match[1];
                    const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${uname}`, {
                        headers: {
                            'X-CSRFToken': csrf,
                            'X-IG-App-ID': '936619743392459',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': `https://www.instagram.com/${uname}/`
                        }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        return json?.data?.user?.id || null;
                    }
                } catch (e) {}

                // Fallback: look for profile_id in scripts (not user_id — that's the logged in user)
                const scripts = Array.from(document.querySelectorAll('script'));
                for (let s of scripts) {
                    const text = s.textContent || '';
                    if (text.includes('"profile_id":"')) {
                        const m = text.match(/"profile_id":"(\d+)"/);
                        if (m) return m[1];
                    }
                }
                return null;
            }, username);
        } catch (e) {
            console.log("Error finding user id:", e);
        }

        if (!userId) {
            console.log("Could not find Target User ID.");
            await browser.close();
            return [];
        }

        console.log("Extracted User ID:", userId);

        console.log("Setting up network intercept for story metadata...");


        console.log("Attempting to click profile picture...");
        try {
            await page.evaluate(() => {
                const header = document.querySelector('header');
                if (header) {
                    const btn = header.querySelector('canvas') || header.querySelector('div[role="button"][tabindex="0"]');
                    if (btn) btn.click();
                }
            });
            await sleep(3000, 5000);

            // Check if we actually navigated to the stories URL
            if (page.url().includes('/stories/')) {
                console.log("Navigated to native story viewer via profile picture click.");

                // Intercept View Story confirm popup if it appears
                try {
                    const viewStoryBtns = await page.$$('div[role="button"]');
                    for (const btn of viewStoryBtns) {
                        const text = await btn.textContent();
                        if (text && text.trim().toLowerCase() === 'view story') {
                            console.log("Found 'View story' confirmation popup. Clicking...");
                            await btn.click();
                            await sleep(3000, 4000);
                            break;
                        }
                    }
                } catch (e) { }

                // Walk through stories using DOM to collect CDN image URLs
                let hasNext = true;
                let loopCount = 0;
                while (hasNext && loopCount < 10) {
                    loopCount++;
                    const mediaSrc = await page.evaluate(() => {
                        const video = document.querySelector('video');
                        if (video && video.src && !video.src.startsWith('blob:')) return { type: 'video', url: video.src };

                        const dict = Array.from(document.querySelectorAll('img[draggable="false"]'));
                        if (dict.length > 0) {
                            const largeImgs = dict.filter(img => {
                                const rect = img.getBoundingClientRect();
                                return rect.width > 200 || rect.height > 200;
                            });
                            if (largeImgs.length > 0) return { type: 'image', url: largeImgs[0].src };
                        }
                        return null;
                    });

                    if (mediaSrc && mediaSrc.url) {
                        if (!storyItems.find(i => i.url === mediaSrc.url)) {
                            console.log(`Found story media from DOM via click-through: ${mediaSrc.type}`);
                            storyItems.push({
                                id: Date.now().toString() + loopCount,
                                url: mediaSrc.url,
                                type: mediaSrc.type,
                                timestamp: new Date().toISOString(),
                                thumbnail: mediaSrc.url,
                                tags: [] // Tags filled in by the context.request API call below
                            });
                        }
                    }



                    hasNext = await page.evaluate(() => {
                        const rightBtn = document.querySelector('button[aria-label="Next"]');
                        if (rightBtn) { rightBtn.click(); return true; }
                        return false;
                    });

                    if (hasNext) await sleep(1500, 2000);
                }

                if (storyItems.length > 0) {
                    // Download images while session is still active (CDN URLs are session-scoped)
                    for (const item of storyItems) {
                        if (item.type === 'image') {
                            try {
                                const tempPath = path.join(__dirname, `_temp_story_${Date.now()}.jpg`);
                                const response = await context.request.get(item.url, {
                                    headers: { 'Referer': 'https://www.instagram.com/' },
                                    timeout: 15000
                                });
                                if (response.ok()) {
                                    const buffer = await response.body();
                                    fs.writeFileSync(tempPath, buffer);
                                    item.localPath = tempPath;
                                    console.log(`[DOWNLOAD] Story image saved to ${tempPath}`);
                                } else {
                                    console.log(`[DOWNLOAD] CDN responded ${response.status()} — skipping local save.`);
                                }
                            } catch (e) {
                                console.log(`[DOWNLOAD] Failed to save story image: ${e.message}`);
                            }
                        }
                    }

                    // Fetch story metadata via context.request (server-side, bypasses CORS)
                    // Must run BEFORE browser.close() since it needs the active session cookies.
                    console.log("[STORIES] Fetching story metadata via context.request...");
                    try {
                        const cookies = await context.cookies();
                        const csrf = cookies.find(c => c.name === 'csrftoken')?.value || '';
                        const apiRes = await context.request.get(
                            `https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}&source=profile`,
                            {
                                headers: {
                                    'X-CSRFToken': csrf,
                                    'X-IG-App-ID': '936619743392459',
                                    'Referer': `https://www.instagram.com/${username}/`,
                                    'Origin': 'https://www.instagram.com'
                                }
                            }
                        );
                        if (apiRes.ok()) {
                            const apiJson = await apiRes.json();
                            const items = apiJson.reels?.[userId]?.items || [];
                            console.log(`[STORIES] context.request returned ${items.length} metadata item(s).`);

                            // Build the authoritative story list from API metadata.
                            // The DOM click-through order may differ from or have fewer items
                            // than the API — assigning tags by index is unreliable when counts
                            // don't match (e.g. DOM captures story 3 but API item[0] is story 1).
                            const domItems = storyItems; // save DOM-captured items aside
                            storyItems = items.map((item, idx) => {
                                const isVideo = item.media_type === 2 || !!item.video_versions;
                                const tags = extractTagsFromItem(item);
                                if (tags.length > 0) console.log(`[STORIES] Tags for story #${idx + 1}:`, tags);
                                return {
                                    id: String(item.pk || item.id),
                                    url: isVideo ? (item.video_versions?.[0]?.url) : (item.image_versions2?.candidates?.[0]?.url),
                                    type: isVideo ? 'video' : 'image',
                                    timestamp: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : new Date().toISOString(),
                                    thumbnail: item.image_versions2?.candidates?.[0]?.url,
                                    tags
                                };
                            });

                            // Attach local downloads for face comparison only when counts match,
                            // which gives us confidence the order is the same.
                            if (domItems.length === storyItems.length) {
                                storyItems.forEach((s, idx) => {
                                    if (domItems[idx]?.localPath) s.localPath = domItems[idx].localPath;
                                });
                            } else {
                                console.log(`[STORIES] DOM captured ${domItems.length} stories but API returned ${storyItems.length} — skipping localPath association to avoid mismatches. Cleaning up temp files.`);
                                for (const d of domItems) {
                                    if (d.localPath) { try { fs.unlinkSync(d.localPath); } catch (_) {} }
                                }
                            }
                        } else {
                            console.log(`[STORIES] context.request returned status ${apiRes.status()}`);
                        }
                    } catch (e) {
                        console.log("[STORIES] context.request failed:", e.message);
                    }

                    await browser.close();
                    return storyItems;

                }

            } else {
                console.log("Clicking profile picture did not open story viewer. Passing to API Fallbacks.");
                await page.keyboard.press('Escape');
                await sleep(1000);
            }
        } catch (e) {
            console.log("Error in DOM click strategy:", e.message);
        }

        // API-only fallback (DOM click failed entirely): fetch story data directly
        console.log("[STORIES] Fetching story metadata via context.request (DOM click failed)...");
        try {
            const cookies = await context.cookies();
            const csrf = cookies.find(c => c.name === 'csrftoken')?.value || '';
            const apiRes = await context.request.get(
                `https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}&source=profile`,
                {
                    headers: {
                        'X-CSRFToken': csrf,
                        'X-IG-App-ID': '936619743392459',
                        'Referer': `https://www.instagram.com/${username}/`,
                        'Origin': 'https://www.instagram.com'
                    }
                }
            );
            if (apiRes.ok()) {
                const apiJson = await apiRes.json();
                const items = apiJson.reels?.[userId]?.items || [];
                console.log(`[STORIES] context.request returned ${items.length} story item(s).`);
                items.forEach(item => {
                    const isVideo = item.media_type === 2 || !!item.video_versions;
                    storyItems.push({
                        id: String(item.pk || item.id),
                        url: isVideo ? (item.video_versions?.[0]?.url) : (item.image_versions2?.candidates?.[0]?.url),
                        type: isVideo ? 'video' : 'image',
                        timestamp: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : new Date().toISOString(),
                        thumbnail: item.image_versions2?.candidates?.[0]?.url,
                        tags: extractTagsFromItem(item)
                    });
                });
            } else {
                console.log(`[STORIES] context.request returned status ${apiRes.status()}`);
            }
        } catch (e) {
            console.log("[STORIES] context.request failed:", e.message);
        }

    } catch (e) {
        console.error("Story fetch error:", e);
    } finally {
        await browser.close();
    }
    return storyItems;
}

async function checkProfileAccess(username) {
    console.log(`Checking profile access for: ${username}`);
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();

    try {
        await page.goto(`https://www.instagram.com/${username}/`);
        await page.waitForLoadState('domcontentloaded');
        await sleep(2000, 4000);

        // Check if we hit a login wall
        if (page.url().includes('login')) {
            console.log("Redirected to login. Cannot check access.");
            return { accessible: false, reason: "Login required" };
        }

        // Check for "This account is private" text
        const isPrivate = await page.evaluate(() => {
            // Instagram uses various tags for this text depending on the react build
            const h2s = Array.from(document.querySelectorAll('h2, span, div'));
            return h2s.some(el => el.textContent && el.textContent.includes('This account is private'));
        });

        if (isPrivate) {
            return { accessible: false, reason: "Account is private and not followed" };
        }

        // Check if account doesn't exist
        const notFound = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('span, h2'));
            return els.some(el => el.textContent && el.textContent.includes("Sorry, this page isn't available"));
        });

        if (notFound) {
            return { accessible: false, reason: "Account not found or deleted" };
        }

        return { accessible: true };
    } catch (e) {
        console.error("Profile access check error:", e);
        return { accessible: false, reason: "Error navigating to profile" };
    } finally {
        await browser.close();
    }
}

/**
 * Downloads a story image URL to a local temp file using Playwright's authenticated context.
 * This avoids CDN geo-restrictions that block direct Node.js https/fetch requests.
 * Returns the local file path, or null on failure.
 */
async function downloadStoryImage(imageUrl, destPath) {
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        const context = await browser.newContext({
            storageState: AUTH_FILE,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const response = await context.request.get(imageUrl, {
            headers: {
                'Referer': 'https://www.instagram.com/',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 15000
        });

        if (!response.ok()) {
            console.log(`[DOWNLOAD] Failed to fetch story image, status: ${response.status()}`);
            return null;
        }

        const buffer = await response.body();
        fs.writeFileSync(destPath, buffer);
        console.log(`[DOWNLOAD] Saved story image to ${destPath}`);
        return destPath;
    } catch (e) {
        console.error(`[DOWNLOAD] Error downloading story image:`, e.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { login, getPostMetadata, getHighlightMetadata, getUserStories, checkProfileAccess, downloadStoryImage };
