import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './Profile.css';

export default function Profile({ onClose }) {
    const { user, login, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [country, setCountry] = useState(user?.country || 'GLOBAL');
    const [avatarFile, setAvatarFile] = useState(null);
    const [status, setStatus] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                setStatus('Error: Image must be < 1MB');
                return;
            }
            setAvatarFile(file);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setStatus('Saving...');

        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('name', name);
        formData.append('country', country);
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        try {
            const res = await fetch('http://localhost:8000/api/profile/update', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Update failed');
            const updatedUser = await res.json();
            // We should update context user here manually or re-fetch
            // For simplicity, just alert success
            setStatus('Saved!');
            // Ideally call a refreshUser() in context
        } catch (err) {
            setStatus('Error saving profile');
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="profile-modal glass-panel">
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>PILOT PROFILE</h2>

                {!user ? (
                    <div className="login-section">
                        <p>Sign in to track stats & compete globally.</p>
                        <GoogleLogin
                            onSuccess={login}
                            onError={() => setStatus('Login Failed')}
                            theme="filled_black"
                            shape="pill"
                        />
                    </div>
                ) : (
                    <div className="profile-content">
                        <div className="avatar-section">
                            <img
                                src={user.avatar_url || 'https://via.placeholder.com/100'}
                                alt="avatar"
                                className="avatar-large"
                            />
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                            <small>Max 1MB</small>
                        </div>

                        <div className="form-group">
                            <label>Callsign (Name)</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={15}
                            />
                        </div>

                        <div className="form-group">
                            <label>Sector (Country)</label>
                            <select value={country} onChange={(e) => setCountry(e.target.value)}>
                                <option value="GLOBAL">Global</option>
                                <option value="US">USA</option>
                                <option value="IN">India</option>
                                <option value="JP">Japan</option>
                                <option value="UK">UK</option>
                                <option value="EU">Europe</option>
                                {/* Add more as needed */}
                            </select>
                        </div>

                        <div className="actions">
                            <button onClick={handleSave} className="save-btn">SAVE DATA</button>
                            <button onClick={logout} className="logout-btn">LOGOUT</button>
                        </div>
                        {status && <p className="status-msg">{status}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
