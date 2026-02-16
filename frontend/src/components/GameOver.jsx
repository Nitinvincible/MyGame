import { useState, useEffect } from 'react';
import { fetchNarration } from '../services/api';
import './GameOver.css';

export default function GameOver({ score, gameState, onRestart, onMenu }) {
    const [commentary, setCommentary] = useState('');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 100);

        // Get AI commentary on the run
        const getCommentary = async () => {
            const result = await fetchNarration({
                ...gameState,
                recent_events: ['final_death', 'game_over'],
            });
            if (result?.narration) {
                setCommentary(result.narration);
            }
        };
        getCommentary();

        return () => clearTimeout(timer);
    }, [gameState]);

    return (
        <div className={`gameover-overlay ${visible ? 'visible' : ''}`}>
            <div className="gameover-panel">
                <h2 className="gameover-title">DERESOLUTION</h2>
                <p className="gameover-subtitle">The Serpent falls silent</p>

                <div className="gameover-score">
                    <span className="score-label">FINAL SCORE</span>
                    <span className="score-number">{score}</span>
                </div>

                <div className="gameover-stats">
                    <div className="go-stat">
                        <span>Length</span>
                        <span className="go-stat-val">{gameState?.length || 0}</span>
                    </div>
                    <div className="go-stat">
                        <span>Level</span>
                        <span className="go-stat-val">{gameState?.level || 1}</span>
                    </div>
                    <div className="go-stat">
                        <span>Time</span>
                        <span className="go-stat-val">{gameState?.time_alive || 0}s</span>
                    </div>
                </div>

                {commentary && (
                    <div className="gameover-commentary">
                        <span className="commentary-prefix">NEXUS://</span> {commentary}
                    </div>
                )}

                <div className="gameover-actions">
                    <button className="btn-primary" onClick={onRestart}>
                        ⟐ REINITIALIZE ⟐
                    </button>
                    <button className="btn-secondary" onClick={onMenu}>
                        MAIN GRID
                    </button>
                </div>
            </div>
        </div>
    );
}
