import { POWERUP_TYPES } from './Engine.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.time = 0;
        this.trailHistory = [];
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

    draw(engine, deltaTime) {
        this.time += deltaTime;
        const ctx = this.ctx;
        const g = this.gridSize;

        // Apply screen shake
        ctx.save();
        if (engine.screenShake > 0) {
            const sx = (Math.random() - 0.5) * engine.screenShake * 2;
            const sy = (Math.random() - 0.5) * engine.screenShake * 2;
            ctx.translate(sx, sy);
        }

        // Background
        ctx.fillStyle = '#05050a';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid
        this.drawGrid(ctx, g);

        // Obstacles
        engine.obstacles.forEach((o) => this.drawObstacle(ctx, o, g));

        // Food
        if (engine.food) this.drawFood(ctx, engine.food, g);

        // Powerups
        engine.powerups.forEach((p) => this.drawPowerup(ctx, p, g));

        // Snake
        this.drawSnake(ctx, engine.snake, engine.activePowerups, g);

        // Particles
        engine.particles.forEach((p) => this.drawParticle(ctx, p, g));

        // Border glow
        this.drawBorder(ctx);

        ctx.restore();
    }

    toScreen(gx, gy) {
        return {
            x: this.offsetX + gx * this.gridSize,
            y: this.offsetY + gy * this.gridSize,
        };
    }

    drawGrid(ctx, g) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.lineWidth = 0.5;
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

    drawSnake(ctx, snake, activePowerups, g) {
        const hasShield = 'shield' in activePowerups;
        const hasPhase = 'phase' in activePowerups;

        snake.forEach((seg, i) => {
            const { x, y } = this.toScreen(seg.x, seg.y);
            const t = i / snake.length;
            const pad = 1;

            // Glow
            if (i === 0) {
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 15;
            }

            // Body gradient from cyan to magenta
            const r = Math.floor(0 + t * 255);
            const gb = Math.floor(240 - t * 200);
            const b = Math.floor(255 - t * 60);
            ctx.fillStyle = `rgba(${r}, ${gb}, ${b}, ${hasPhase ? 0.5 : 0.9})`;

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

    drawFood(ctx, food, g) {
        const { x, y } = this.toScreen(food.x, food.y);
        const pulse = Math.sin(food.pulse) * 0.15 + 0.85;
        const size = g * 0.35 * pulse;

        // Outer glow
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#39ff14';
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Halo ring
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.2 + Math.sin(food.pulse * 1.5) * 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + g / 2, y + g / 2, size + 4 + Math.sin(food.pulse) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawObstacle(ctx, obs, g) {
        const { x, y } = this.toScreen(obs.x, obs.y);
        const pulse = Math.sin(this.time * 2 + obs.x * 0.5) * 0.1 + 0.9;

        ctx.shadowColor = '#ff2244';
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(255, 34, 68, ${0.7 * pulse})`;
        this.roundRect(ctx, x + 2, y + 2, g - 4, g - 4, 3);
        ctx.fill();
        ctx.shadowBlur = 0;

        // X pattern
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 5, y + 5);
        ctx.lineTo(x + g - 5, y + g - 5);
        ctx.moveTo(x + g - 5, y + 5);
        ctx.lineTo(x + 5, y + g - 5);
        ctx.stroke();
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

    drawBorder(ctx) {
        const x = this.offsetX;
        const y = this.offsetY;
        const w = this.cols * this.gridSize;
        const h = this.rows * this.gridSize;
        const pulse = Math.sin(this.time) * 0.2 + 0.5;

        ctx.strokeStyle = `rgba(0, 240, 255, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        // Corner accents
        const corner = 15;
        ctx.strokeStyle = `rgba(255, 0, 170, ${pulse * 0.8})`;
        ctx.lineWidth = 3;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(x, y + corner);
        ctx.lineTo(x, y);
        ctx.lineTo(x + corner, y);
        ctx.stroke();
        // Top-right
        ctx.beginPath();
        ctx.moveTo(x + w - corner, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + corner);
        ctx.stroke();
        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(x, y + h - corner);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + corner, y + h);
        ctx.stroke();
        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(x + w - corner, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - corner);
        ctx.stroke();
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
