import { POWERUP_TYPES } from './Engine.js';

const THEMES = {
    space: {
        bg: '#05050a',
        grid: 'rgba(0, 240, 255, 0.04)',
        glow: '#00f0ff',
        food: '#39ff14',
        obstacle: '#ff2244',
        border: 'rgba(0, 240, 255, 0.5)'
    },
    sea: {
        bg: '#001e30',
        grid: 'rgba(0, 100, 255, 0.05)',
        glow: '#0088ff',
        food: '#ffaa00',
        obstacle: '#ff4444',
        border: 'rgba(0, 100, 255, 0.5)'
    },
    land: {
        bg: '#1a1614',
        grid: 'rgba(100, 255, 50, 0.05)',
        glow: '#55ff00',
        food: '#ffff00',
        obstacle: '#888888',
        border: 'rgba(100, 255, 50, 0.5)'
    }
};

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.time = 0;
        this.stars = [];
        this.bubbles = [];
        this.rocks = [];
        this.initEffects();
    }

    initEffects() {
        // Space Stars
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 2,
                blinkOffset: Math.random() * 10
            });
        }
        // Sea Bubbles
        for (let i = 0; i < 20; i++) {
            this.bubbles.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 5 + 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    resize(cols, rows) {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;

        const gx = Math.floor(this.width / cols);
        const gy = Math.floor(this.height / rows);
        this.gridSize = Math.min(gx, gy);
        this.offsetX = Math.floor((this.width - this.gridSize * cols) / 2);
        this.offsetY = Math.floor((this.height - this.gridSize * rows) / 2);
        this.cols = cols;
        this.rows = rows;
    }

    draw(engine, deltaTime, themeName = 'space') {
        this.time += deltaTime;
        const ctx = this.ctx;
        const g = this.gridSize;
        const theme = THEMES[themeName] || THEMES.space;

        // Apply screen shake
        ctx.save();
        if (engine.screenShake > 0) {
            const sx = (Math.random() - 0.5) * engine.screenShake * 2;
            const sy = (Math.random() - 0.5) * engine.screenShake * 2;
            ctx.translate(sx, sy);
        }

        // Background
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Theme Background Effects
        this.drawBackgroundEffects(ctx, themeName);

        // Grid
        this.drawGrid(ctx, g, theme.grid, themeName);

        // Obstacles
        engine.obstacles.forEach((o) => this.drawObstacle(ctx, o, g, theme.obstacle, themeName));

        // Food
        if (engine.food) this.drawFood(ctx, engine.food, g, theme.food);

        // Powerups
        engine.powerups.forEach((p) => this.drawPowerup(ctx, p, g));

        // Snake
        this.drawSnake(ctx, engine.snake, engine.activePowerups, g, themeName, theme);

        // Particles
        engine.particles.forEach((p) => this.drawParticle(ctx, p, g));

        // Border glow
        this.drawBorder(ctx, theme.border);

        ctx.restore();
    }

    drawBackgroundEffects(ctx, themeName) {
        if (themeName === 'space') {
            // Planet
            const planetX = this.width * 0.8;
            const planetY = this.height * 0.2;
            const radius = Math.min(this.width, this.height) * 0.15;

            const grad = ctx.createRadialGradient(planetX - radius * 0.3, planetY - radius * 0.3, radius * 0.1, planetX, planetY, radius);
            grad.addColorStop(0, '#4facfe');
            grad.addColorStop(1, '#00f2fe');
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(planetX, planetY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Stars
            ctx.fillStyle = '#ffffff';
            this.stars.forEach(s => {
                const alpha = Math.abs(Math.sin(this.time + s.blinkOffset));
                ctx.globalAlpha = alpha * 0.8;
                ctx.beginPath();
                ctx.arc(s.x * this.width, s.y * this.height, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
        }
        else if (themeName === 'sea') {
            // Bubbles
            ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
            this.bubbles.forEach(b => {
                b.y -= b.speed * 0.5;
                if (b.y < -0.1) b.y = 1.1; // reset
                const x = b.x * this.width + Math.sin(this.time + b.x * 10) * 20;
                const y = b.y * this.height;
                ctx.beginPath();
                ctx.arc(x, y, b.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        else if (themeName === 'land') {
            // Texture (simple noise/dots)
            ctx.fillStyle = 'rgba(100, 80, 50, 0.1)';
            for (let i = 0; i < this.width; i += 40) {
                for (let j = 0; j < this.height; j += 40) {
                    if ((i + j) % 3 === 0) ctx.fillRect(i, j, 4, 4);
                }
            }
        }
    }

    toScreen(gx, gy) {
        return {
            x: this.offsetX + gx * this.gridSize,
            y: this.offsetY + gy * this.gridSize,
        };
    }

    drawGrid(ctx, g, color, themeName) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;

        if (themeName === 'sea') {
            ctx.beginPath();
            for (let x = 0; x <= this.cols; x++) {
                const sx = this.offsetX + x * g;
                // Wavy vertical lines
                for (let y = 0; y <= this.height; y += 10) {
                    const wave = Math.sin(y * 0.05 + this.time) * 2;
                    if (y === 0) ctx.moveTo(sx + wave, y);
                    else ctx.lineTo(sx + wave, y);
                }
            }
            ctx.stroke();
            // Horizontal lines
            ctx.beginPath();
            for (let y = 0; y <= this.rows; y++) {
                const sy = this.offsetY + y * g;
                ctx.moveTo(this.offsetX, sy);
                ctx.lineTo(this.offsetX + this.cols * g, sy);
            }
            ctx.stroke();
        } else {
            // Normal grid
            for (let x = 0; x <= this.cols; x++) {
                const sx = this.offsetX + x * g;
                ctx.beginPath();
                ctx.moveTo(sx, this.offsetY);
                ctx.lineTo(sx, this.offsetY + this.rows * g);
                ctx.stroke();
            }
            for (let y = 0; y <= this.rows; y++) {
                const sy = this.offsetY + y * g;
                ctx.beginPath();
                ctx.moveTo(this.offsetX, sy);
                ctx.lineTo(this.offsetX + this.cols * g, sy);
                ctx.stroke();
            }
        }
    }

    drawSnake(ctx, snake, activePowerups, g, themeName, theme) {
        const hasShield = 'shield' in activePowerups;
        const hasPhase = 'phase' in activePowerups;

        snake.forEach((seg, i) => {
            const { x, y } = this.toScreen(seg.x, seg.y);
            const t = i / snake.length;
            const pad = 1;

            // Glow
            if (i === 0) {
                ctx.shadowColor = theme.glow;
                ctx.shadowBlur = 15;
            }

            // Body color Logic
            if (themeName === 'sea') {
                const b = Math.floor(255 - t * 100);
                const gVal = Math.floor(100 + t * 155);
                ctx.fillStyle = `rgba(0, ${gVal}, ${b}, ${hasPhase ? 0.5 : 0.9})`;
            } else if (themeName === 'land') {
                const r = Math.floor(100 + t * 155); // brown/orange
                const gVal = Math.floor(155 - t * 100);
                ctx.fillStyle = `rgba(${r}, ${gVal}, 0, ${hasPhase ? 0.5 : 0.9})`;
            } else {
                // Space (Cyan -> Magenta)
                const r = Math.floor(0 + t * 255);
                const gVal = Math.floor(240 - t * 200);
                const b = Math.floor(255 - t * 60);
                ctx.fillStyle = `rgba(${r}, ${gVal}, ${b}, ${hasPhase ? 0.5 : 0.9})`;
            }

            const radius = Math.max(2, g * 0.15);
            this.roundRect(ctx, x + pad, y + pad, g - pad * 2, g - pad * 2, radius);
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Head details
            if (i === 0) {
                // Eyes
                const eyeSize = Math.max(2, g * 0.12);
                ctx.fillStyle = '#ffffff';
                const dir = snake.length > 1
                    ? { x: snake[0].x - snake[1].x, y: snake[0].y - snake[1].y }
                    : { x: 1, y: 0 };
                const ex1 = x + g * 0.3 + dir.y * g * 0.15;
                const ey1 = y + g * 0.3 + dir.x * g * 0.15;
                const ex2 = x + g * 0.7 + dir.y * g * 0.15;
                const ey2 = y + g * 0.7 + dir.x * g * 0.15;
                ctx.beginPath();
                ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
                ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
                ctx.fill();

                // Pupils
                ctx.fillStyle = '#05050a';
                ctx.beginPath();
                ctx.arc(ex1 + dir.x * 1.5, ey1 + dir.y * 1.5, eyeSize * 0.55, 0, Math.PI * 2);
                ctx.arc(ex2 + dir.x * 1.5, ey2 + dir.y * 1.5, eyeSize * 0.55, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Shield aura
        if (hasShield) {
            const head = snake[0];
            const { x, y } = this.toScreen(head.x, head.y);
            const pulse = Math.sin(this.time * 4) * 0.2 + 0.4;
            ctx.strokeStyle = `rgba(0, 170, 255, ${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x + g / 2, y + g / 2, g * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawFood(ctx, food, g, color) {
        const { x, y } = this.toScreen(food.x, food.y);
        const pulse = Math.sin(food.pulse) * 0.15 + 0.85;
        const size = g * 0.35 * pulse;

        // Outer glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Halo ring
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.2 + Math.sin(food.pulse * 1.5) * 0.15;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size + 4 + Math.sin(food.pulse) * 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawObstacle(ctx, obs, g, color, themeName) {
        const { x, y } = this.toScreen(obs.x, obs.y);
        const pulse = Math.sin(this.time * 2 + obs.x * 0.5) * 0.1 + 0.9;

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7 * pulse;

        if (themeName === 'land') {
            // Rock shape
            ctx.beginPath();
            ctx.moveTo(x + 2, y + g - 2);
            ctx.lineTo(x + g / 2, y + 2);
            ctx.lineTo(x + g - 2, y + g - 2);
            ctx.fill();
        } else {
            this.roundRect(ctx, x + 2, y + 2, g - 4, g - 4, 3);
            ctx.fill();

            // X pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + g - 5, y + g - 5);
            ctx.moveTo(x + g - 5, y + 5);
            ctx.lineTo(x + 5, y + g - 5);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawPowerup(ctx, powerup, g) {
        const { x, y } = this.toScreen(powerup.x, powerup.y);
        const floatY = Math.sin(powerup.float) * 3;
        const config = POWERUP_TYPES[powerup.type] || {};

        ctx.shadowColor = config.color || '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = config.color || '#ffffff';
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2 + floatY, g * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, g * 0.35)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.symbol || '?', x + g / 2, y + g / 2 + floatY);
    }

    drawParticle(ctx, p, g) {
        const alpha = Math.max(0, p.life / p.maxLife);
        const { x, y } = this.toScreen(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size * alpha, p.size * alpha);
        ctx.globalAlpha = 1;
    }

    drawBorder(ctx, color) {
        const x = this.offsetX;
        const y = this.offsetY;
        const w = this.cols * this.gridSize;
        const h = this.rows * this.gridSize;
        const pulse = Math.sin(this.time) * 0.2 + 0.5;

        ctx.strokeStyle = color;
        ctx.globalAlpha = pulse * 0.5;
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
