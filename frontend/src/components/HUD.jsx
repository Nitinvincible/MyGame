import { useState, useEffect, useRef } from 'react';
import './HUD.css';

export default function HUD({ engine, narration, eventLog, aiConnected }) {
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [length, setLength] = useState(3);
    const [powerups, setPowerups] = useState({});
    const displayRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (engine?.current) {
                setScore(engine.current.score);
                setLevel(engine.current.level);
                setLength(engine.current.snake?.length || 3);
                setPowerups({ ...engine.current.activePowerups });
            }
        }, 100);
        return () => clearInterval(interval);
    }, [engine]);

    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollTop = displayRef.current.scrollHeight;
        }
    }, [eventLog]);

    const activePowerupList = Object.keys(powerups);

    return (
        <div className="hud">
            <div className="hud-top">
                <div className="hud-stats">
                    <div className="stat">
                        <span className="stat-label">SCORE</span>
                        <span className="stat-value score-value">{score}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">LEVEL</span>
                        <span className="stat-value">{level}</span>
                    </div>
                    <div className="stat">
                        <span className="stat-label">LENGTH</span>
                        <span className="stat-value">{length}</span>
                    </div>
                </div>

                <div className="hud-ai-status">
                    <span className={`ai-dot ${aiConnected ? 'connected' : ''}`} />
                    <span className="ai-label">NEXUS {aiConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
            </div>

            {activePowerupList.length > 0 && (
                <div className="hud-powerups">
                    {activePowerupList.map((type) => (
                        <span key={type} className={`powerup-badge ${type}`}>
                            {type.replace('_', ' ').toUpperCase()}
                        </span>
                    ))}
                </div>
            )}

            {narration && (
                <div className="hud-narration">
                    <span className="narration-prefix">NEXUS://</span> {narration}
                </div>
            )}

            {eventLog.length > 0 && (
                <div className="hud-events" ref={displayRef}>
                    {eventLog.slice(-5).map((evt, i) => (
                        <div key={i} className="event-line">
                            <span className="event-dot">▸</span> {evt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
