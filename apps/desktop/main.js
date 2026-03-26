import { app, BrowserWindow, ipcMain, dialog } from 'electron';

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { autoUpdater } = require('electron-updater');
const { startDailyCheck, runManualCheck } = require('./scraper/scheduler.js');
const { login, getPostMetadata, getHighlightMetadata, checkProfileAccess } = require('./scraper/instagram.js');
const { getAccounts, addAccount, updateAccount, removeAccount, getStoryLogs, deleteStoryLog } = require('./scraper/db.js');
const { getDataDir } = require('./scraper/paths.js');
const { setLicenseKey } = require('./scraper/appConfig.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setName('LoveLattice');
app.setPath('userData', path.join(app.getPath('appData'), 'LoveLattice'));

function setupLogging() {
  const logDir = path.join(app.getPath('userData'), 'logs');
  const logFile = path.join(logDir, 'main.log');
  fs.mkdirSync(logDir, { recursive: true });

  const append = (level, args) => {
    const line = `[${new Date().toISOString()}] [${level}] ${args.map(arg => {
      if (arg instanceof Error) return `${arg.stack || arg.message}`;
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ')}\n`;

    try {
      fs.appendFileSync(logFile, line);
    } catch {
      // Avoid recursive logging failures.
    }
  };

  const originalLog = console.log.bind(console);
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.log = (...args) => {
    append('INFO', args);
    originalLog(...args);
  };
  console.error = (...args) => {
    append('ERROR', args);
    originalError(...args);
  };
  console.warn = (...args) => {
    append('WARN', args);
    originalWarn(...args);
  };

  process.on('uncaughtException', (error) => {
    append('UNCAUGHT_EXCEPTION', [error]);
  });

  process.on('unhandledRejection', (reason) => {
    append('UNHANDLED_REJECTION', [reason]);
  });

  console.log(`[Logger] Writing main-process logs to ${logFile}`);
}

function startStaticServer() {
  const server = express();
  server.use(cors());
  const dataDir = getDataDir();
  server.use('/thumbnails', express.static(path.join(dataDir, 'thumbnails')));
  server.use('/uploads', express.static(path.join(dataDir, 'uploads')));
  
  server.get('/api/proxy-image', (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) return res.status(400).json({ error: 'Missing url' });
    import('https').then(https => {
      https.get(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://www.instagram.com/'
        }
      }, proxyRes => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
    });
  });

  server.listen(3002, () => console.log('Static Express Server running on 3002 to serve React assets'));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    title: 'LoveLattice',
    icon: path.join(__dirname, 'public/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://127.0.0.1:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

// --- Auto-updater setup ---
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://aftycwoxeulwcakvlnst.supabase.co/storage/v1/object/public/releases/'
});

autoUpdater.on('update-available', () => {
  console.log('[Updater] New update available — downloading in background...');
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['Restart Now', 'Later'],
    title: 'Update Ready',
    message: 'A new version of LoveLattice has been downloaded. Restart to apply the update.'
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  console.error('[Updater] Error checking for updates:', err.message);
});
// ----------------------------

app.whenReady().then(() => {
  setupLogging();

  // Ensure writable data directories exist on first launch
  const dataDir = getDataDir();
  fs.mkdirSync(path.join(dataDir, 'thumbnails'), { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'uploads'), { recursive: true });

  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'public/mac-icon.png'));
  }
  createWindow();
  startStaticServer();
  startDailyCheck();

  // Check for updates (only in production builds, not dev mode)
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('getAccounts', async () => await getAccounts());
ipcMain.handle('addAccount', async (e, data) => {
  const access = await checkProfileAccess(data.username);
  if (!access.accessible) throw new Error(access.reason);
  return await addAccount(data);
});
ipcMain.handle('updateAccount', async (e, { id, data }) => await updateAccount(id, data));
ipcMain.handle('removeAccount', async (e, id) => await removeAccount(id));

ipcMain.handle('uploadFaceImage', async (e, { id, fileName, buffer }) => {
  if (!buffer) throw new Error("No file buffer provided");
  const accounts = await getAccounts();
  const account = accounts.find(a => a.id === id);
  if (!account) throw new Error("Account not found");

  const safeFileName = Date.now() + '-' + fileName;
  const dataDir = getDataDir();
  const destPath = path.join(dataDir, 'uploads', safeFileName);
  fs.writeFileSync(destPath, Buffer.from(buffer));

  if (account.storyConfig && account.storyConfig.referenceFaceUrl) {
    const oldPath = path.join(dataDir, 'uploads', account.storyConfig.referenceFaceUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const updatedConfig = { ...account.storyConfig, referenceFaceUrl: safeFileName };
  return await updateAccount(id, { storyConfig: updatedConfig });
});

ipcMain.handle('removeFaceImage', async (e, id) => {
  const accounts = await getAccounts();
  const account = accounts.find(a => a.id === id);
  if (!account) throw new Error("Account not found");

  if (account.storyConfig && account.storyConfig.referenceFaceUrl) {
    const dataDir = getDataDir();
    const oldPath = path.join(dataDir, 'uploads', account.storyConfig.referenceFaceUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const updatedConfig = { ...account.storyConfig, referenceFaceUrl: null };
  return await updateAccount(id, { storyConfig: updatedConfig });
});

ipcMain.handle('getStoryLogs', async () => await getStoryLogs());
ipcMain.handle('deleteStoryLog', async (e, id) => await deleteStoryLog(id));

ipcMain.handle('preview', async (e, { url }) => {
  if (url.includes('/p/') || url.includes('/reel/')) return await getPostMetadata(url);
  if (url.includes('/s/') || url.includes('/stories/')) return await getHighlightMetadata(url);
  throw new Error("Invalid URL");
});

ipcMain.handle('login', async () => await login({ headless: false }));
ipcMain.handle('scan', async () => {
  runManualCheck().catch(console.error);
  return { success: true };
});

ipcMain.handle('logout', async () => {
  const statePath = path.join(getDataDir(), 'storageState.json');
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
  return { success: true };
});

ipcMain.handle('openProfile', async (e, username) => {
  const { openProfile } = require('./scraper/instagram.js');
  await openProfile(username);
  return { success: true };
});

ipcMain.handle('setLicenseKey', async (e, licenseKey) => {
  setLicenseKey(licenseKey || null);
  return { success: true };
});
