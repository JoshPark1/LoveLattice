export const API_BASE = 'http://localhost:3001/api';
export const SERVER_BASE = 'http://localhost:3002';

export const fetchAccounts = async () => window.electron.invoke('getAccounts');
export const addAccount = async (data) => window.electron.invoke('addAccount', data);
export const updateAccount = async (id, data) => window.electron.invoke('updateAccount', { id, data });
export const removeAccount = async (id) => window.electron.invoke('removeAccount', id);

export const uploadFaceImage = async (id, file) => {
    const arrayBuffer = await file.arrayBuffer();
    const res = await window.electron.invoke('uploadFaceImage', { id, fileName: file.name, buffer: arrayBuffer });
    return res;
};
export const removeFaceImage = async (id) => window.electron.invoke('removeFaceImage', id);

export const fetchStoryLogs = async () => window.electron.invoke('getStoryLogs');
export const deleteStoryLog = async (id) => window.electron.invoke('deleteStoryLog', id);
export const fetchPreview = async (url) => window.electron.invoke('preview', { url });
export const triggerLogin = async () => window.electron.invoke('login');
export const triggerScan = async () => window.electron.invoke('scan');
export const triggerLogout = async () => window.electron.invoke('logout');
export const openProfileSession = async (username) => window.electron.invoke('openProfile', username);
