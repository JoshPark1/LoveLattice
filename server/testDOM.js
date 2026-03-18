const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: 'storageState.json' });
    const page = await context.newPage();

    await page.goto('https://www.instagram.com/pie_dolphin/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
        const header = document.querySelector('header');
        if (header) {
            const btn = header.querySelector('canvas') || header.querySelector('div[role="button"][tabindex="0"]');
            if (btn) btn.click();
        }
    });

    await page.waitForTimeout(5000); // allow story to load

    // Check if view story popup exists
    try {
        const viewStoryBtns = await page.$$('div[role="button"]');
        for (const btn of viewStoryBtns) {
            const text = await btn.textContent();
            if (text && text.trim().toLowerCase() === 'view story') {
                console.log("Found 'View story' confirmation popup. Clicking...");
                await btn.click();
                await page.waitForTimeout(4000);
                break;
            }
        }
    } catch (e) { }

    const imgData = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
            src: img.src,
            width: img.width || img.getBoundingClientRect().width,
            height: img.height || img.getBoundingClientRect().height,
            className: img.className,
            alt: img.alt,
            draggable: img.getAttribute('draggable')
        }));
    });

    console.log(JSON.stringify(imgData, null, 2));
    await browser.close();
})();
