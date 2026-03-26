const fs = require('fs');
const path = require('path');
const { getDataDir } = require('./paths');

const CONFIG_PATH = path.join(getDataDir(), 'app-config.json');

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (error) {
        console.error('[CONFIG] Failed to read app config:', error.message);
        return {};
    }
}

function writeConfig(config) {
    try {
        fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('[CONFIG] Failed to write app config:', error.message);
    }
}

function getLicenseKey() {
    return readConfig().licenseKey || null;
}

function setLicenseKey(licenseKey) {
    const config = readConfig();
    if (licenseKey) {
        config.licenseKey = licenseKey;
    } else {
        delete config.licenseKey;
    }
    writeConfig(config);
}

module.exports = {
    getLicenseKey,
    setLicenseKey
};
