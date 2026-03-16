const { compareFaces } = require('./faceRecognition');
const path = require('path');

const refPhoto = '/Users/joshuapark/projects/ig_tracker/server/uploads/1773197860031-jason_target.JPG';
const storyPhoto = process.argv[2] || path.join(__dirname, '_temp_story_test.jpg');

console.log('Reference photo:', refPhoto);
console.log('Story photo:', storyPhoto);
console.log('Starting compareFaces...');

const start = Date.now();
compareFaces(refPhoto, storyPhoto).then(result => {
    console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.log('Result:', JSON.stringify(result, null, 2));
}).catch(e => {
    console.error('Error:', e.message);
});
