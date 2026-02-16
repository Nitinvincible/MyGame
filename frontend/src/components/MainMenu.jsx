import { useState, useEffect, useRef } from 'react';
import './MainMenu.css';

export default function MainMenu({ onStart }) {
    const canvasRef = useRef(null);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const particles = [];
        let animId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 0.5,
                color: ['#00f0ff', '#ff00aa', '#39ff14'][Math.floor(Math.random() * 3)],
                alpha: Math.random() * 0.5 + 0.2,
            });
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(5, 5, 10, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <div className="menu-container">
            <canvas ref={canvasRef} className="menu-particles" />
            <div className="menu-content">
                <div className="menu-logo">
                    <h1 className="glitch-text" data-text="SERPENT">SERPENT</h1>
                    <p className="menu-subtitle">AI-EVOLVED SNAKE // 2026</p>
                </div>

                <div className="menu-tagline">
                    <span className="tagline-line">Every run is narrated by <em>NEXUS</em></span>
                    <span className="tagline-line">An AI Game Master powered by Gemini</span>
                </div>

                <div className="menu-actions">
                    <button className="btn-primary" onClick={onStart}>
                        <span className="btn-content">⟐ INITIALIZE ⟐</span>
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => setShowControls(!showControls)}
                    >
                        {showControls ? 'HIDE' : 'SHOW'} CONTROLS
                    </button>
                </div>

                {showControls && (
                    <div className="controls-panel">
                        <div className="control-row"><kbd>↑ ↓ ← →</kbd> <span>/ WASD — Move</span></div>
                        <div className="control-row"><kbd>SPACE</kbd> <span>— Pause</span></div>
                        <div className="control-row"><kbd>T</kbd> <span>— AI Chat</span></div>
                        <div className="control-row"><kbd>M</kbd> <span>— Mute</span></div>
                    </div>
                )}

                <div className="menu-footer">
                    <span className="blink">▮</span> GEMINI-POWERED <span className="blink">▮</span>
                </div>
            </div>
        </div>
    );
}
