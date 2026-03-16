const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext({
        storageState: 'storageState.json',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/pie_dolphin/');
    await page.waitForLoadState('domcontentloaded');

    const data = await page.evaluate(async () => {
        let csrf = '';
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        if (match) csrf = match[1];

        const req1 = await fetch('https://www.instagram.com/graphql/query/?query_hash=c9c56db64beb4c9dea2d17f40d897f38&variables={"reel_ids":["1208917288"],"tag_names":[],"location_ids":[],"highlight_reel_ids":[],"precomposed_overlay":false,"show_story_viewer_list":true,"story_viewer_fetch_count":50,"story_viewer_cursor":"","stories_video_dash_manifest":false}', {
            headers: { 'X-CSRFToken': csrf, 'X-IG-App-ID': '936619743392459' }
        });

        const req2 = await fetch('https://i.instagram.com/api/v1/feed/user/1208917288/story/', {
            headers: { 'X-CSRFToken': csrf, 'X-IG-App-ID': '936619743392459', 'User-Agent': 'Instagram 219.0.0.12.117 Android' }
        });

        const req3 = await fetch('https://i.instagram.com/api/v1/feed/reels_media/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrf, 'X-IG-App-ID': '936619743392459', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'user_ids=1208917288'
        });

        return {
            gqlStatus: req1.status,
            gqlData: await req1.json().catch(() => null),
            storyStatus: req2.status,
            storyData: await req2.json().catch(() => null),
            reelsStatus: req3.status,
            reelsData: await req3.json().catch(() => null)
        };
    });

    console.log(JSON.stringify(data, null, 2));
    await browser.close();
})();
