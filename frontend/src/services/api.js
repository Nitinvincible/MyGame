const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:8000';

async function post(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`API call failed (${endpoint}):`, error.message);
        return null;
    }
}

export async function fetchNarration(gameState) {
    return await post('/narrate', gameState);
}

export async function sendChat(message, gameContext) {
    return await post('/chat', { message, ...gameContext });
}

export async function fetchDifficulty(playerStats) {
    return await post('/difficulty', playerStats);
}

export async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        return await response.json();
    } catch {
        return null;
    }
}
