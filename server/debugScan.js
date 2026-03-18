const { getUserStories } = require('./instagram');

const TARGET_USERNAME = 'pie_dolphin';

(async () => {
    console.log(`\n=== Story Tag Debug Scan for @${TARGET_USERNAME} ===\n`);
    try {
        const stories = await getUserStories(TARGET_USERNAME);

        if (stories.length === 0) {
            console.log('No active stories found (account may have no stories, or login may have expired).');
            return;
        }

        console.log(`Found ${stories.length} story item(s):\n`);
        stories.forEach((story, idx) => {
            console.log(`--- Story #${idx + 1} ---`);
            console.log(`  Type:      ${story.type}`);
            console.log(`  Timestamp: ${story.timestamp}`);
            console.log(`  Tags:      ${story.tags && story.tags.length > 0 ? story.tags.join(', ') : '(none detected)'}`);
            console.log(`  Thumbnail: ${story.thumbnail ? story.thumbnail.substring(0, 60) + '...' : 'N/A'}`);
            console.log('');
        });

    } catch (e) {
        console.error('Error during debug scan:', e);
    }
})();
