export const API_BASE = 'http://localhost:3001/api';
export const SERVER_BASE = 'http://localhost:3001';

// Accounts
export const fetchAccounts = async () => {
    const res = await fetch(`${API_BASE}/accounts`);
    return res.json();
};

export const addAccount = async (data) => {
    const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const parsed = await res.json();
    if (!res.ok) throw new Error(parsed.error || "Failed to add account");
    return parsed;
};

export const updateAccount = async (id, data) => {
    const res = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const removeAccount = async (id) => {
    const res = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
    return res.json();
};

export const uploadFaceImage = async (id, file) => {
    const formData = new FormData();
    formData.append('faceImage', file);
    const res = await fetch(`${API_BASE}/accounts/${id}/face`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
};

// Logs
export const fetchStoryLogs = async () => {
    const res = await fetch(`${API_BASE}/story-logs`);
    return res.json();
};

export const deleteStoryLog = async (id) => {
    const res = await fetch(`${API_BASE}/story-logs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete story log');
    return res.json();
};

// Utils
export const fetchPreview = async (url) => {
    const res = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to fetch preview');
    return res.json();
};

export const triggerLogin = async () => {
    const res = await fetch(`${API_BASE}/login`, { method: 'POST' });
    return res.json();
};

export const triggerScan = async () => {
    const res = await fetch(`${API_BASE}/scan`, { method: 'POST' });
    return res.json();
};
