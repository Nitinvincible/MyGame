import { useRef, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './MainMenu.css';
import AuthModal from './AuthModal';

export default function MainMenu({ onStart, onProfile, onLeaderboard, theme, setTheme }) {
    const canvasRef = useRef(null);
    const { user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrame;

        // Init particles based on theme
        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 1,
            speedY: Math.random() * 0.5 + 0.1,
            speedX: (Math.random() - 0.5) * 0.5
        }));

        const render = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const w = canvas.width;
            const h = canvas.height;

            // Background & Effects
            if (theme === 'sea') {
                ctx.fillStyle = '#051e3e';
                ctx.fillRect(0, 0, w, h);
                // Gradient overlay
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, 'rgba(5, 30, 62, 1)');
                grad.addColorStop(1, 'rgba(0, 50, 80, 1)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
            }
            else if (theme === 'land') {
                ctx.fillStyle = '#1a140e';
                ctx.fillRect(0, 0, w, h);
                // Dust overlay
                ctx.fillStyle = 'rgba(100, 80, 60, 0.05)';
                ctx.fillRect(0, 0, w, h);
            }
            else { // Space
                ctx.fillStyle = '#0a0a12';
                ctx.fillRect(0, 0, w, h);

                // Draw Planet in BG
                const px = w * 0.8;
                const py = h * 0.2;
                const radius = Math.min(w, h) * 0.2;
                const grad = ctx.createRadialGradient(px - radius * 0.3, py - radius * 0.3, radius * 0.1, px, py, radius);
                grad.addColorStop(0, '#4facfe');
                grad.addColorStop(1, '#00f2fe');
                ctx.fillStyle = grad;
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.arc(px, py, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            // Particles
            ctx.fillStyle = theme === 'sea' ? 'rgba(100, 200, 255, 0.3)' :
                theme === 'land' ? 'rgba(150, 255, 100, 0.2)' :
                    'rgba(0, 255, 242, 0.3)';

            particles.forEach(p => {
                if (theme === 'sea') {
                    p.y -= p.speedY; // bubbles rise
                    p.x += Math.sin(Date.now() * 0.001 + p.y * 0.1) * 0.5;
                    if (p.y < 0) p.y = h;
                } else if (theme === 'land') {
                    p.x += p.speedX; // dust drift
                    p.y += p.speedY * 0.2;
                    if (p.x > w) p.x = 0;
                    if (p.x < 0) p.x = w;
                    if (p.y > h) p.y = 0;
                } else {
                    // Space stars (static twinkle or slow drift)
                    p.y -= p.speedY * 0.1;
                    if (p.y < 0) p.y = h;
                }

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
                            <button className="menu-btn" onClick={() => setShowAuthModal(true)} style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#aaa', border: '1px solid #333' }}>
                                MANUAL OVERRIDE (ID/PASS)
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

            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </div>
    );
}
