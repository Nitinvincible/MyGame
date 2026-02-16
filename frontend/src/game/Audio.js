export class Audio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 0.3;
        }
        return this.muted;
    }

    playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.ctx || this.muted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    eat() {
        this.playTone(523, 0.08, 'square', 0.2);
        setTimeout(() => this.playTone(659, 0.08, 'square', 0.2), 50);
        setTimeout(() => this.playTone(784, 0.12, 'square', 0.15), 100);
    }

    die() {
        this.playTone(200, 0.3, 'sawtooth', 0.25);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.2), 100);
        setTimeout(() => this.playTone(80, 0.5, 'sawtooth', 0.15), 200);
    }

    powerup() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.15, 'sine', 0.15), i * 60);
        });
    }

    levelUp() {
        [392, 494, 587, 784, 988].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.2, 'triangle', 0.2), i * 80);
        });
    }

    shieldBreak() {
        this.playTone(300, 0.2, 'sawtooth', 0.2);
        this.playTone(600, 0.1, 'square', 0.1);
    }

    uiClick() {
        this.playTone(800, 0.05, 'sine', 0.1);
    }
}
