import { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './MainMenu.css';

export default function MainMenu({ onStart, onProfile, onLeaderboard, theme, setTheme }) {
    const canvasRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrame;

        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * 0.5 + 0.1
        }));

        const render = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // bg color based on theme
            if (theme === 'sea') ctx.fillStyle = '#051e3e';
            else if (theme === 'land') ctx.fillStyle = '#1a140e';
            else ctx.fillStyle = '#0a0a12'; // space

            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = theme === 'sea' ? 'rgba(100, 200, 255, 0.3)' :
                theme === 'land' ? 'rgba(150, 255, 100, 0.2)' :
                    'rgba(0, 255, 242, 0.3)';

            particles.forEach(p => {
                p.y -= p.speedY;
                if (p.y < 0) p.y = canvas.height;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrame = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrame);
    }, [theme]);

    return (
        <div className="menu-container">
            <canvas ref={canvasRef} className="menu-particles" />
            <div className="menu-content">
                <div className="menu-logo">
                    <h1 className="glitch-text" data-text="SERPENT">SERPENT</h1>
                    <p className="menu-subtitle">NEURAL LINK ESTABLISHED</p>
                </div>

                <div className="menu-actions">
                    {!user ? (
                        <>
                            <button className="btn-primary highlight" onClick={onProfile}>
                                ⌬ ACCESS TERMINAL (LOGIN)
                            </button>
                            <div className="secondary-actions">
                                <button className="menu-btn" onClick={onStart}>GUEST ACCESS</button>
                                <button className="menu-btn" onClick={onLeaderboard}>LEADERBOARD</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="welcome-msg">WELCOME, COMMANDER {user.name.toUpperCase()}</p>
                            <button className="btn-primary" onClick={onStart}>
                                INITIATE MISSION
                            </button>

                            <div className="secondary-actions">
                                <button className="menu-btn" onClick={onProfile}>PROFILE</button>
                                <button className="menu-btn" onClick={onLeaderboard}>LEADERBOARD</button>
                            </div>
                        </>
                    )}

                    <div className="theme-selector">
                        <span>ENVIRONMENT:</span>
                        <div className="theme-options">
                            <button
                                className={theme === 'space' ? 'active' : ''}
                                onClick={() => setTheme('space')}
                            >SPACE</button>
                            <button
                                className={theme === 'sea' ? 'active' : ''}
                                onClick={() => setTheme('sea')}
                            >SEA</button>
                            <button
                                className={theme === 'land' ? 'active' : ''}
                                onClick={() => setTheme('land')}
                            >LAND</button>
                        </div>
                    </div>
                </div>

                <div className="menu-footer">
                    SYSTEM STATUS: ONLINE
                </div>
            </div>
        </div>
    );
}
