import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Leaderboard.css'; // Re-use modal styles

export default function AuthModal({ onClose }) {
    const { manualLoginUser, signupUser } = useAuth();
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        country: 'GLOBAL'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                await signupUser(
                    formData.username,
                    formData.password,
                    formData.name || 'Pilot',
                    formData.country
                );
            } else {
                await manualLoginUser(formData.username, formData.password);
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="leaderboard-modal" style={{ height: 'auto', maxWidth: '400px' }}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="tabs">
                    <button
                        className={mode === 'login' ? 'active' : ''}
                        onClick={() => setMode('login')}
                    >LOGIN</button>
                    <button
                        className={mode === 'signup' ? 'active' : ''}
                        onClick={() => setMode('signup')}
                    >SIGNUP</button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {error && <div style={{ color: '#ff4444', background: 'rgba(255,0,0,0.1)', padding: '0.5rem' }}>{error}</div>}

                    <input
                        type="text"
                        placeholder="USERNAME"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        required
                        style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#fff' }}
                    />

                    <input
                        type="password"
                        placeholder="PASSWORD"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#fff' }}
                    />

                    {mode === 'signup' && (
                        <>
                            <input
                                type="text"
                                placeholder="PILOT NAME (DISPLAY)"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#fff' }}
                            />
                            <select
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: '#fff' }}
                            >
                                <option value="GLOBAL">GLOBAL</option>
                                <option value="IN">INDIA</option>
                                <option value="US">USA</option>
                                <option value="UK">UK</option>
                                <option value="JP">JAPAN</option>
                            </select>
                        </>
                    )}

                    <button
                        type="submit"
                        className="btn-primary highlight"
                        disabled={loading}
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'PROCESSING...' : (mode === 'login' ? 'ACCESS SYSTEM' : 'INITIALIZE PILOT')}
                    </button>
                </form>
            </div>
        </div>
    );
}
