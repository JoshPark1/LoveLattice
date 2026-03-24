const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Downloads an image from a URL and saves it to a local path.
 * Uses a fake User-Agent to bypass basic hotlink protection.
 */
function downloadThumbnail(url, id) {
    return new Promise((resolve, reject) => {
        const destPath = path.join(__dirname, '../../../data', 'thumbnails', `${id}.jpg`);
        const file = fs.createWriteStream(destPath);

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://www.instagram.com/'
            }
        };

        https.get(url, options, (res) => {
            if (res.statusCode !== 200) {
                fs.unlink(destPath, () => { }); // Delete the file if error
                return reject(new Error(`Failed to download image. Status code: ${res.statusCode}`));
            }

            res.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve(`/thumbnails/${id}.jpg`); // Return the public path
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => { }); // Delete the file if error
            reject(err);
        });
    });
}

/**
 * Deletes a downloaded thumbnail from the disk.
 */
function deleteThumbnail(id) {
    const thumbnailPath = path.join(__dirname, '../../../data', 'thumbnails', `${id}.jpg`);
    if (fs.existsSync(thumbnailPath)) {
        try {
            fs.unlinkSync(thumbnailPath);
            console.log(`[DEBUG] Deleted thumbnail: ${thumbnailPath}`);
        } catch (e) {
            console.error(`[ERROR] Failed to delete thumbnail ${id}:`, e.message);
        }
    }
}

module.exports = { downloadThumbnail, deleteThumbnail };
