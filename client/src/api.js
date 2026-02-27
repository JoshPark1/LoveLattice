export const API_BASE = 'http://localhost:3001/api';
export const SERVER_BASE = 'http://localhost:3001';

export const fetchTrackedItems = async () => {
    const res = await fetch(`${API_BASE}/tracked-items`);
    return res.json();
};

export const addTracker = async (data) => {
    const res = await fetch(`${API_BASE}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

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

export const removeTracker = async (id) => {
    const res = await fetch(`${API_BASE}/track/${id}`, {
        method: 'DELETE',
    });
    return res.json();
};

export const triggerScan = async () => {
    const res = await fetch(`${API_BASE}/scan`, { method: 'POST' });
    return res.json();
};

