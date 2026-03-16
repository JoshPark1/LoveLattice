const fs = require('fs');
let content = fs.readFileSync('instagram.js', 'utf8');

const newFunc = `async function getUserStories(username) {
    console.log(\`Fetching active stories for: \${username}\`);
    const { browser, context } = await getBrowserContext();
    const page = await context.newPage();
    let storyItems = [];

    try {
        console.log(\`Navigating to profile to fetch stories for \${username}\`);
        
        await page.goto(\`https://www.instagram.com/\${username}/\`);
        await page.waitForLoadState('domcontentloaded');
        await sleep(2000, 4000);

        if (page.url().includes('login')) {
            console.log("Redirected to login. Stories require login.");
            await browser.close();
            return [];
        }

        let userId = null;
        try {
            userId = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                for (let s of scripts) {
                    const text = s.textContent || '';
                    if (text.includes('"profile_id":"')) {
                        const match = text.match(/"profile_id":"(\\d+)"/);
                        if (match) return match[1];
                    }
                    if (text.includes('"user_id":"')) {
                        const match = text.match(/"user_id":"(\\d+)"/);
                        if (match) return match[1];
                    }
                }
                return null;
            });
        } catch (e) { }

        if (!userId) {
            console.log("Could not find Target User ID.");
            await browser.close();
            return [];
        }

        const storiesData = await page.evaluate(async (uid) => {
            try {
                const res = await fetch(\`https://www.instagram.com/graphql/query/?query_hash=c9c56db64beb4c9dea2d17f40d897f38&variables={"reel_ids":["\${uid}"],"tag_names":[],"location_ids":[],"highlight_reel_ids":[],"precomposed_overlay":false,"show_story_viewer_list":true,"story_viewer_fetch_count":50,"story_viewer_cursor":"","stories_video_dash_manifest":false}\`);
                if (!res.ok) return null;
                return await res.json();
            } catch (err) {
                return null;
            }
        }, userId);
        
        if (storiesData && storiesData.data && storiesData.data.reels_media && storiesData.data.reels_media.length > 0) {
            const items = storiesData.data.reels_media[0].items || [];
            items.forEach(item => {
                const isVideo = item.is_video;
                storyItems.push({
                    id: item.id,
                    url: isVideo ? (item.video_resources?.[0]?.src || item.video_versions?.[0]?.url) : (item.display_url || item.image_versions2?.candidates?.[0]?.url),
                    type: isVideo ? 'video' : 'image',
                    timestamp: item.taken_at_timestamp ? new Date(item.taken_at_timestamp * 1000).toISOString() : new Date().toISOString(),
                    thumbnail: item.display_url || item.image_versions2?.candidates?.[0]?.url,
                    tags: extractTagsFromItem(item)
                });
            });
        }

        if (storyItems.length > 0) {
            await browser.close();
            return storyItems;
        }

        const mobileHeaders = {
            'User-Agent': 'Instagram 219.0.0.12.117 Android',
            'X-IG-App-ID': '936619743392459'
        };
        
        const fallbackData = await page.evaluate(async (uid, headers) => {
             try {
                 const res = await fetch(\`https://i.instagram.com/api/v1/feed/user/\${uid}/reel_media/\`, { headers });
                 if (!res.ok) return null;
                 return await res.json();
             } catch (err) { return null; }
        }, userId, mobileHeaders);

        if (fallbackData && fallbackData.items && fallbackData.items.length > 0) {
             const items = fallbackData.items;
             items.forEach(item => {
                 const isVideo = item.media_type === 2;
                 storyItems.push({
                     id: item.id,
                     url: isVideo ? (item.video_versions?.[0]?.url) : (item.image_versions2?.candidates?.[0]?.url),
                     type: isVideo ? 'video' : 'image',
                     timestamp: item.taken_at ? new Date(item.taken_at * 1000).toISOString() : new Date().toISOString(),
                     thumbnail: item.image_versions2?.candidates?.[0]?.url,
                     tags: extractTagsFromItem(item)
                 });
             });
        }

    } catch (e) {
        console.error("Story fetch error:", e);
    } finally {
        await browser.close();
    }
    return storyItems;
}

async function checkProfileAccess(username) {`;

const startIndex = content.indexOf('async function getUserStories(username) {');
const endIndex = content.indexOf('async function checkProfileAccess(username) {');

if (startIndex !== -1 && endIndex !== -1) {
    fs.writeFileSync('instagram.js', content.substring(0, startIndex) + newFunc + content.substring(endIndex + 45));
    console.log('Replaced successfully');
} else {
    console.log('Indexes not found');
}
