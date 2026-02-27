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

module.exports = { login, getPostMetadata, getHighlightMetadata };
