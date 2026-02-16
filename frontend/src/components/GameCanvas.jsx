import { useRef, useEffect, useCallback } from 'react';
import { Engine, DIRECTIONS } from '../game/Engine';
import { Renderer } from '../game/Renderer';

const COLS = 30;
const ROWS = 20;

export default function GameCanvas({ onGameOver, onEvent, engineRef, audioRef }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const animRef = useRef(null);
    const lastTimeRef = useRef(0);
    const pausedRef = useRef(false);

    const initGame = useCallback(() => {
        if (!engineRef.current) {
            engineRef.current = new Engine(COLS, ROWS);
        } else {
            engineRef.current.reset();
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        if (!rendererRef.current) {
            rendererRef.current = new Renderer(canvas);
        }
        rendererRef.current.resize(COLS, ROWS);
    }, [engineRef]);

    useEffect(() => {
        initGame();

        const handleResize = () => {
            if (rendererRef.current) {
                rendererRef.current.resize(COLS, ROWS);
            }
        };
        window.addEventListener('resize', handleResize);

        const handleKey = (e) => {
            const engine = engineRef.current;
            if (!engine) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    engine.setDirection(DIRECTIONS.UP);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    engine.setDirection(DIRECTIONS.DOWN);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    engine.setDirection(DIRECTIONS.LEFT);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    engine.setDirection(DIRECTIONS.RIGHT);
                    break;
                case ' ':
                    e.preventDefault();
                    pausedRef.current = !pausedRef.current;
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);

        // Touch controls
        let touchStart = null;
        const handleTouchStart = (e) => {
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        };
        const handleTouchEnd = (e) => {
            if (!touchStart) return;
            const dx = e.changedTouches[0].clientX - touchStart.x;
            const dy = e.changedTouches[0].clientY - touchStart.y;
            const engine = engineRef.current;
            if (!engine) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                engine.setDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
            } else {
                engine.setDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
            }
            touchStart = null;
        };
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        // Game loop
        const loop = (timestamp) => {
            const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
            lastTimeRef.current = timestamp;

            const engine = engineRef.current;
            const renderer = rendererRef.current;

            if (engine && renderer && !pausedRef.current) {
                const events = engine.update(delta);
                renderer.draw(engine, delta);

                // Handle events
                events.forEach((evt) => {
                    if (evt === 'ate_food' && audioRef?.current) audioRef.current.eat();
                    if (evt === 'died' && audioRef?.current) audioRef.current.die();
                    if (evt.startsWith('powerup_') && !evt.includes('expired') && audioRef?.current)
                        audioRef.current.powerup();
                    if (evt === 'level_up' && audioRef?.current) audioRef.current.levelUp();
                    if (evt === 'shield_break' && audioRef?.current) audioRef.current.shieldBreak();
                    if (onEvent) onEvent(evt);
                });

                if (engine.gameOver) {
                    onGameOver(engine.score, engine.getState());
                }
            } else if (engine && renderer && pausedRef.current) {
                renderer.draw(engine, 0);
            }

            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(animRef.current);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [initGame, onGameOver, onEvent, engineRef, audioRef]);

    return <canvas ref={canvasRef} className="game-canvas" />;
}
