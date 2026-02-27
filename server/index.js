const express = require('express');
const cors = require('cors');
const { startDailyCheck } = require('./scheduler');
const { login, getPostMetadata, getHighlightMetadata } = require('./instagram');
const { getTrackedItems, addTrackedItem, removeTrackedItem } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve downloaded thumbnails

// API Endpoints

app.get('/api/proxy-image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ error: 'Missing url parameter' });

  const https = require('https');
  https.get(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.instagram.com/'
    }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (e) => {
    res.status(500).json({ error: e.message });
  });
});

// 1. Get all tracked items
app.get('/api/tracked-items', async (req, res) => {
  const items = await getTrackedItems();
  res.json(items);
});

// 2. Add a new item to track
app.post('/api/track', async (req, res) => {
  const { url, type, targetMediaId, thumbnailUrl, note } = req.body;
  try {
    const newItem = await addTrackedItem({ url, type, targetMediaId, thumbnailUrl, note });
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2.5 Delete a tracked item
app.delete('/api/track/:id', async (req, res) => {
  try {
    await removeTrackedItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Fetch metadata (preview) for a URL
// Returns list of media items in a carousel or stories in a highlight
app.post('/api/preview', async (req, res) => {
  const { url } = req.body;
  try {
    // Determine type based on URL
    let data;
    if (url.includes('/p/') || url.includes('/reel/')) {
      data = await getPostMetadata(url);
    } else if (url.includes('/s/') || url.includes('/stories/')) {
      data = await getHighlightMetadata(url);
    } else {
      return res.status(400).json({ error: 'Invalid URL type. Must be post, reel, or highlight/story.' });
    }
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// 4. Trigger manual login (if needed)
app.post('/api/login', async (req, res) => {
  try {
    await login({ headless: false }); // Open visible browser
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Trigger manual scan
app.post('/api/scan', async (req, res) => {
  try {
    // Start scan asynchronously so we don't block the request if there are many items
    const { runManualCheck } = require('./scheduler');
    runManualCheck().catch(e => console.error("Manual check error:", e));
    res.json({ success: true, message: "Scan started in background" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Start the cron job
  startDailyCheck();
});
