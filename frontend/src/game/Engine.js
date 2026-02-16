const GRID_SIZE = 20;
const INITIAL_SPEED = 8;

export const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
};

const POWERUP_TYPES = {
    speed_boost: { duration: 5000, color: '#ff6600', symbol: '⚡', label: 'VELOCITY' },
    shield: { duration: 8000, color: '#00aaff', symbol: '🛡️', label: 'SHIELD' },
    shrink: { duration: 0, color: '#ff00aa', symbol: '✂️', label: 'SHRINK' },
    multiplier: { duration: 6000, color: '#ffdd00', symbol: '×2', label: 'MULTIPLIER' },
    phase: { duration: 4000, color: '#aa00ff', symbol: '👻', label: 'PHASE' },
};

export class Engine {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.reset();
    }

    reset() {
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);
        this.snake = [
            { x: cx, y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy },
        ];
        this.direction = DIRECTIONS.RIGHT;
        this.nextDirection = DIRECTIONS.RIGHT;
        this.food = null;
        this.obstacles = [];
        this.powerups = [];
        this.activePowerups = {};
        this.score = 0;
        this.level = 1;
        this.deaths = 0;
        this.gameOver = false;
        this.speed = INITIAL_SPEED;
        this.baseSpeed = INITIAL_SPEED;
        this.scoreMultiplier = 1;
        this.recentEvents = [];
        this.timeAlive = 0;
        this.tickAccumulator = 0;
        this.particles = [];
        this.screenShake = 0;
        this.spawnFood();
    }

    spawnFood() {
        let pos;
        do {
            pos = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows),
            };
        } while (this.isOccupied(pos));
        this.food = { ...pos, pulse: 0 };
    }

    isOccupied(pos) {
        return (
            this.snake.some((s) => s.x === pos.x && s.y === pos.y) ||
            this.obstacles.some((o) => o.x === pos.x && o.y === pos.y)
        );
    }

    setDirection(dir) {
        // Prevent 180-degree turns
        if (dir.x + this.direction.x === 0 && dir.y + this.direction.y === 0) return;
        this.nextDirection = dir;
    }

    update(deltaTime) {
        if (this.gameOver) return [];

        this.timeAlive += deltaTime;
        const events = [];

        // Update particles
        this.particles = this.particles.filter((p) => {
            p.life -= deltaTime;
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vx *= 0.98;
            p.vy *= 0.98;
            return p.life > 0;
        });

        // Update powerup timers
        for (const [type, data] of Object.entries(this.activePowerups)) {
            data.remaining -= deltaTime * 1000;
            if (data.remaining <= 0) {
                delete this.activePowerups[type];
                if (type === 'speed_boost') this.speed = this.baseSpeed;
                if (type === 'multiplier') this.scoreMultiplier = 1;
                events.push(`powerup_expired_${type}`);
            }
        }

        // Food pulse animation
        if (this.food) this.food.pulse += deltaTime * 3;

        // Powerup float animation
        this.powerups.forEach((p) => (p.float = (p.float || 0) + deltaTime * 2));

        // Screen shake decay
        if (this.screenShake > 0) this.screenShake *= 0.9;
        if (this.screenShake < 0.1) this.screenShake = 0;

        // Tick-based movement
        this.tickAccumulator += deltaTime;
        const tickInterval = 1 / this.speed;

        if (this.tickAccumulator >= tickInterval) {
            this.tickAccumulator -= tickInterval;
            this.direction = this.nextDirection;

            const head = this.snake[0];
            const newHead = {
                x: head.x + this.direction.x,
                y: head.y + this.direction.y,
            };

            // Wall collision
            const hasPhase = 'phase' in this.activePowerups;
            if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
                if (hasPhase) {
                    newHead.x = ((newHead.x % this.cols) + this.cols) % this.cols;
                    newHead.y = ((newHead.y % this.rows) + this.rows) % this.rows;
                } else if ('shield' in this.activePowerups) {
                    delete this.activePowerups.shield;
                    this.screenShake = 5;
                    this.addParticles(head.x, head.y, '#00aaff', 15);
                    events.push('shield_break');
                    return events;
                } else {
                    this.die(events);
                    return events;
                }
            }

            // Self collision
            if (this.snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
                if ('shield' in this.activePowerups) {
                    delete this.activePowerups.shield;
                    this.screenShake = 5;
                    this.addParticles(head.x, head.y, '#00aaff', 15);
                    events.push('shield_break');
                    return events;
                } else if (!hasPhase) {
                    this.die(events);
                    return events;
                }
            }

            // Obstacle collision
            const hitObstacle = this.obstacles.find((o) => o.x === newHead.x && o.y === newHead.y);
            if (hitObstacle) {
                if ('shield' in this.activePowerups) {
                    delete this.activePowerups.shield;
                    this.obstacles = this.obstacles.filter((o) => o !== hitObstacle);
                    this.screenShake = 5;
                    this.addParticles(hitObstacle.x, hitObstacle.y, '#ff4444', 20);
                    events.push('shield_break_obstacle');
                } else if (hasPhase) {
                    // Pass through
                } else {
                    this.die(events);
                    return events;
                }
            }

            this.snake.unshift(newHead);

            // Food collision
            if (this.food && newHead.x === this.food.x && newHead.y === this.food.y) {
                const points = 10 * this.scoreMultiplier;
                this.score += points;
                this.addParticles(this.food.x, this.food.y, '#39ff14', 25);
                this.screenShake = 3;
                events.push('ate_food');
                this.recentEvents.push('ate_food');
                if (this.recentEvents.length > 10) this.recentEvents.shift();

                // Level up every 50 points
                const newLevel = Math.floor(this.score / 50) + 1;
                if (newLevel > this.level) {
                    this.level = newLevel;
                    this.baseSpeed = Math.min(INITIAL_SPEED + this.level * 0.5, 18);
                    if (!('speed_boost' in this.activePowerups)) this.speed = this.baseSpeed;
                    events.push('level_up');
                    this.addParticles(newHead.x, newHead.y, '#ffdd00', 40);
                    this.screenShake = 8;
                }

                this.spawnFood();
            } else {
                this.snake.pop();
            }

            // Powerup collision
            const hitPowerup = this.powerups.find((p) => p.x === newHead.x && p.y === newHead.y);
            if (hitPowerup) {
                this.activatePowerup(hitPowerup, events);
                this.powerups = this.powerups.filter((p) => p !== hitPowerup);
            }
        }

        return events;
    }

    die(events) {
        this.gameOver = true;
        this.deaths++;
        const head = this.snake[0];
        this.addParticles(head.x, head.y, '#ff0044', 50);
        this.addParticles(head.x, head.y, '#ff6600', 30);
        this.screenShake = 15;
        events.push('died');
        this.recentEvents.push('died');
    }

    activatePowerup(powerup, events) {
        const config = POWERUP_TYPES[powerup.type];
        if (!config) return;

        this.addParticles(powerup.x, powerup.y, config.color, 20);
        this.screenShake = 3;
        events.push(`powerup_${powerup.type}`);
        this.recentEvents.push(`powerup_${powerup.type}`);

        if (powerup.type === 'shrink') {
            const removeCount = Math.max(0, this.snake.length - 3);
            if (removeCount > 0) this.snake.splice(-Math.floor(removeCount / 2));
        } else if (powerup.type === 'speed_boost') {
            this.speed = this.baseSpeed * 1.5;
            this.activePowerups.speed_boost = { remaining: config.duration };
        } else if (powerup.type === 'multiplier') {
            this.scoreMultiplier = 2;
            this.activePowerups.multiplier = { remaining: config.duration };
        } else {
            this.activePowerups[powerup.type] = { remaining: config.duration };
        }
    }

    addObstacle(x, y) {
        if (x === undefined) {
            do {
                x = Math.floor(Math.random() * this.cols);
                y = Math.floor(Math.random() * this.rows);
            } while (this.isOccupied({ x, y }) || (this.food && this.food.x === x && this.food.y === y));
        }
        this.obstacles.push({ x, y, spawn: Date.now() });
        this.addParticles(x, y, '#ff4444', 15);
    }

    addPowerup(type) {
        if (!POWERUP_TYPES[type]) type = 'speed_boost';
        let x, y;
        do {
            x = Math.floor(Math.random() * this.cols);
            y = Math.floor(Math.random() * this.rows);
        } while (this.isOccupied({ x, y }) || (this.food && this.food.x === x && this.food.y === y));
        this.powerups.push({ x, y, type, float: 0, spawn: Date.now(), ...POWERUP_TYPES[type] });
    }

    addParticles(gridX, gridY, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x: gridX,
                y: gridY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.8,
                maxLife: 1.3,
                color,
                size: 2 + Math.random() * 4,
            });
        }
    }

    getState() {
        return {
            score: this.score,
            length: this.snake.length,
            level: this.level,
            deaths: this.deaths,
            active_powerups: Object.keys(this.activePowerups),
            recent_events: [...this.recentEvents],
            time_alive: Math.floor(this.timeAlive),
        };
    }
}

export { POWERUP_TYPES };
