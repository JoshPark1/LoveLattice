const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, data) => {
    const validChannels = [
      'getAccounts', 'addAccount', 'updateAccount', 'removeAccount', 'uploadFaceImage', 'removeFaceImage',
      'getStoryLogs', 'deleteStoryLog', 'preview', 'login', 'scan', 'logout', 'openProfile'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  }
});
