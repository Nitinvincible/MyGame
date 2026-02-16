import { useState, useEffect } from 'react';
import './Leaderboard.css';

export default function Leaderboard({ onClose, userCountry }) {
    const [tab, setTab] = useState('GLOBAL');
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            try {
                const countryParam = tab === 'COUNTRY' ? (userCountry || 'GLOBAL') : 'GLOBAL';
                const res = await fetch(`http://localhost:8000/api/leaderboard?country=${countryParam}`);
                const data = await res.json();
                setScores(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchScores();
    }, [tab, userCountry]);

    return (
        <div className="modal-overlay">
            <div className="leaderboard-modal glass-panel">
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>LEADERBOARD</h2>

                <div className="tabs">
                    <button
                        className={tab === 'GLOBAL' ? 'active' : ''}
                        onClick={() => setTab('GLOBAL')}
                    >
                        GLOBAL
                    </button>
                    {userCountry && (
                        <button
                            className={tab === 'COUNTRY' ? 'active' : ''}
                            onClick={() => setTab('COUNTRY')}
                        >
                            {userCountry}
                        </button>
                    )}
                </div>

                <div className="leaderboard-header">
                    <span className="col-rank">#</span>
                    <span className="col-player">PILOT</span>
                    <span className="col-score">HIGH SCORE</span>
                    <span className="col-total">TOTAL XP</span>
                </div>

                <div className="score-list">
                    {loading ? (
                        <p>Loading data...</p>
                    ) : scores.length === 0 ? (
                        <p>No scores yet.</p>
                    ) : (
                        scores.map((s, i) => (
                            <div key={i} className="score-row">
                                <span className="rank">#{i + 1}</span>
                                <div className="player-info">
                                    <img
                                        src={s.avatar_url || 'https://via.placeholder.com/32'}
                                        alt="avatar"
                                        className="avatar-small"
                                    />
                                    <span className="name">{s.name || 'Unknown'}</span>
                                    {s.country && s.country !== 'GLOBAL' && (
                                        <span className="flag">{s.country}</span>
                                    )}
                                </div>
                                <span className="score high-score">{s.high_score}</span>
                                <span className="score total-score">{s.total_score}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
