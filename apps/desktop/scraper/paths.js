/**
 * paths.js — Single source of truth for the app's writable data directory.
 *
 * Dev:  <repo-root>/data/          (existing behavior, no change)
 * Prod: ~/Library/Application Support/LoveLattice/data/
 */
const path = require('path');

function getDataDir() {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../../../data');
  }
  // In production, `electron` is available in the main process and any
  // CommonJS module required from it.
  const { app } = require('electron');
  return path.join(app.getPath('userData'), 'data');
}

module.exports = { getDataDir };
