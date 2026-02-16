const API_URL = import.meta.env.VITE_API_URL || '/api';

export const checkHealth = async () => {
    try {
        const res = await fetch(`${API_URL}/health`);
        return await res.json();
    } catch (e) {
        return { status: 'offline' };
    }
};

export const fetchNarration = async (gameState) => {
    try {
        const res = await fetch(`${API_URL}/narrate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gameState),
        });
        return await res.json();
    } catch (e) {
        console.error("Narration failed", e);
        return null; // Fallback handled in UI
    }
};

export const fetchChat = async (message, gameState) => {
    try {
        const res = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, ...gameState }),
        });
        return await res.json();
    } catch (e) {
        return { reply: "signal_lost..." };
    }
};

export const fetchDifficulty = async (stats) => {
    try {
        const res = await fetch(`${API_URL}/difficulty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stats),
        });
        return await res.json();
    } catch (e) {
        return null;
    }
};
// Auth
export const googleAuth = async (token) => {
    const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
    });
    return res.json();
};

export const manualSignup = async (username, password, name, country) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, country })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const manualLogin = async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateProfile = async (formData) => {
    const res = await fetch(`${API_URL}/profile/update`, {
        method: 'POST',
        body: formData, // Auto-sets Content-Type for FormData
    });
    if (!res.ok) throw new Error('Update failed');
    return await res.json();
};

export const submitScore = async (userId, score, level) => {
    try {
        const res = await fetch(`${API_URL}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, score, level }),
        });
        return await res.json();
    } catch (e) {
        console.error("Score submission failed", e);
        return { status: 'error' };
    }
};

export const fetchLeaderboard = async (country = 'GLOBAL') => {
    try {
        const res = await fetch(`${API_URL}/leaderboard?country=${country}`);
        return await res.json();
    } catch (e) {
        return [];
    }
};
