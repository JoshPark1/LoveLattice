const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { startDailyCheck } = require('./scheduler');
const { login, getPostMetadata, getHighlightMetadata, checkProfileAccess } = require('./instagram');
const { getAccounts, addAccount, updateAccount, removeAccount, getStoryLogs, deleteStoryLog } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Setup Multer for face photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve downloaded thumbnails
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve reference faces

// 1. Proxy Image (avoid CORS for external ig images)
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

// --- Accounts API ---

// Get all accounts
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await getAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new account
app.post('/api/accounts', async (req, res) => {
  try {
    const { username, note } = req.body;

    // Profile Accessibility Check
    const access = await checkProfileAccess(username);
    if (!access.accessible) {
      return res.status(403).json({ error: access.reason });
    }

    const newAccount = await addAccount({ username, note });
    res.json(newAccount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an entire account (trackedPosts, storyConfig without image)
app.put('/api/accounts/:id', async (req, res) => {
  try {
    const updated = await updateAccount(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an account
app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await removeAccount(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload a reference face for story config
app.post('/api/accounts/:id/face', upload.single('faceImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Read current account
    const accounts = await getAccounts();
    const account = accounts.find(a => a.id === req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    // Clean up old file if exists
    if (account.storyConfig && account.storyConfig.referenceFaceUrl) {
      const oldPath = path.join(__dirname, 'uploads', account.storyConfig.referenceFaceUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update with new path
    const updatedConfig = {
      ...account.storyConfig,
      referenceFaceUrl: req.file.filename // Store filename 
    };

    const updated = await updateAccount(req.params.id, { storyConfig: updatedConfig });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Story Logs API ---

app.get('/api/story-logs', async (req, res) => {
  try {
    const logs = await getStoryLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/story-logs/:id', async (req, res) => {
  try {
    await deleteStoryLog(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// --- Verification & IG Scraper API ---

// Preview metadata
app.post('/api/preview', async (req, res) => {
  const { url } = req.body;
  try {
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

app.post('/api/login', async (req, res) => {
  try {
    await login({ headless: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scan', async (req, res) => {
  try {
    const { runManualCheck } = require('./scheduler');
    runManualCheck().catch(e => console.error("Manual check error:", e));
    res.json({ success: true, message: "Scan started in background" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startDailyCheck();
});
