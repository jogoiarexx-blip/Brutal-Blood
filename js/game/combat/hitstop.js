import { GAME } from "../core/config.js";
export const HITSTOP = {
    light: 3,
    medium: 5,
    heavy: 8,
    kickLight: 3,
    kickHeavy: 8,
    aerial: 4,
    special: 8,
    super: 12,
    throw: 7,
    counterBonus: 4,
    blockMul: 0.5,
    koBonus: 10,
    finish: 18,
    superFreeze: 12,
    clash: 8,
    tech: 7,
    min: 1,
    max: 24,
};
export function defaultHitstopFrames(move) {
    if (typeof move.hitstop === "number")
        return move.hitstop;
    if (move.type === "super")
        return HITSTOP.super;
    if (move.type === "special")
        return HITSTOP.special;
    if (move.type === "throw")
        return HITSTOP.throw;
    if (move.type === "aerial")
        return HITSTOP.aerial;
    if (move.button === "heavy" || move.button === "kickHeavy")
        return HITSTOP.heavy;
    if (move.button === "medium")
        return HITSTOP.medium;
    if (move.button === "kickLight")
        return HITSTOP.kickLight;
    if (move.button === "light")
        return HITSTOP.light;
    return HITSTOP.medium;
}
export function computeHitstop(opts) {
    let frames = defaultHitstopFrames(opts.move);
    let kind = opts.move.type === "super" ? "super" : opts.move.type === "throw" ? "throw" : "hit";
    if (opts.blocked) {
        frames = Math.max(HITSTOP.min, Math.round(frames * HITSTOP.blockMul));
        kind = "block";
    }
    else if (opts.counter) {
        frames += HITSTOP.counterBonus;
        kind = "counter";
    }
    if (opts.ko && !opts.blocked) {
        frames += HITSTOP.koBonus;
        kind = "ko";
    }
    return { frames: Math.max(HITSTOP.min, Math.min(HITSTOP.max, frames)), kind };
}
export class HitStop {
    remaining = 0;
    total = 0;
    kind = "hit";
    x = 0;
    y = 0;
    dir = 1;
    color = "#fff8f0";
    flash = 0;
    enabled = true;
    fx = true;
    attacker = null;
    victim = null;
    lastFrames = 0;
    get frozen() {
        return this.remaining > 0;
    }
    /** 1 at the start of the freeze, 0 at the end. */
    get t() {
        return this.total > 0 ? this.remaining / this.total : 0;
    }
    configure(enabled, fx) {
        this.enabled = enabled;
        this.fx = fx;
        if (!enabled)
            this.remaining = 0;
    }
    trigger(opts) {
        const frames = Math.max(0, Math.round(opts.frames));
        this.kind = opts.kind;
        this.x = opts.x;
        this.y = opts.y;
        this.dir = opts.dir || 1;
        this.color = opts.color;
        this.attacker = opts.attacker ?? null;
        this.victim = opts.victim ?? null;
        this.lastFrames = frames;
        if (opts.fx !== undefined)
            this.fx = opts.fx;
        if (!this.enabled || frames <= 0) {
            this.flash = this.fx ? 0.28 : 0;
            return;
        }
        this.remaining = frames;
        this.total = frames;
        this.flash = opts.kind === "block" ? 0.35 : opts.kind === "ko" || opts.kind === "finish" ? 0.85 : 0.55;
        if (opts.victim)
            opts.victim.impactSquash = opts.kind === "block" ? 0.4 : 0.85;
        if (opts.attacker)
            opts.attacker.impactSquash = opts.kind === "superFreeze" ? 0.2 : 0.35;
    }
    tick() {
        if (this.remaining > 0)
            this.remaining -= 1;
        this.flash *= 0.84;
        if (this.flash < 0.02)
            this.flash = 0;
        if (this.frozen) {
            this.attacker?.presentFrozen(GAME.FRAME);
            this.victim?.presentFrozen(GAME.FRAME);
        }
    }
    decayFlash() {
        if (this.remaining > 0)
            return;
        this.flash *= 0.84;
        if (this.flash < 0.02)
            this.flash = 0;
    }
    reset() {
        this.remaining = 0;
        this.total = 0;
        this.flash = 0;
        this.attacker = null;
        this.victim = null;
    }
    drawWorld(ctx) {
        if (!this.fx)
            return;
        const active = this.frozen || this.flash > 0.04;
        if (!active)
            return;
        const t = this.frozen ? this.t : this.flash;
        const p = 1 - t;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalCompositeOperation = "lighter";
        const glow = this.kind === "block" ? "#8ec8ff" : this.kind === "ko" || this.kind === "finish" ? "#ff4a3a" : this.color;
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.35 * t;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + p * 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.kind === "block" ? "#cfe8ff" : "#fff8f0";
        ctx.lineWidth = 2 + t * 3;
        ctx.globalAlpha = 0.85 * t;
        ctx.beginPath();
        ctx.arc(0, 0, 16 + p * 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 8 + p * 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.rotate(this.dir > 0 ? -0.42 : 0.42);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3 + t * 4;
        ctx.globalAlpha = Math.min(1, t * 1.4);
        ctx.beginPath();
        ctx.moveTo(-52, -6);
        ctx.lineTo(56, 4);
        ctx.moveTo(-40, 10);
        ctx.lineTo(38, -8);
        ctx.stroke();
        if (this.kind === "ko" || this.kind === "super" || this.kind === "finish" || this.kind === "counter") {
            ctx.rotate(0.7);
            ctx.globalAlpha = 0.5 * t;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-70, 0);
            ctx.lineTo(70, 0);
            ctx.stroke();
        }
        ctx.restore();
    }
    drawScreen(ctx) {
        if (!this.fx || this.flash <= 0.02 && !this.frozen)
            return;
        const t = Math.max(this.flash, this.frozen ? this.t * 0.65 : 0);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (this.kind === "block") {
            ctx.fillStyle = `rgba(180, 210, 255, ${0.12 * t})`;
        }
        else if (this.kind === "clash") {
            ctx.fillStyle = `rgba(244, 228, 196, ${0.18 * t})`;
        }
        else if (this.kind === "tech") {
            ctx.fillStyle = `rgba(140, 200, 255, ${0.16 * t})`;
        }
        else if (this.kind === "ko" || this.kind === "finish") {
            ctx.fillStyle = `rgba(90, 0, 8, ${0.28 * t})`;
        }
        else if (this.kind === "super" || this.kind === "superFreeze") {
            ctx.fillStyle = `rgba(20, 0, 4, ${0.32 * t})`;
        }
        else {
            ctx.fillStyle = `rgba(255, 236, 220, ${0.1 * t})`;
        }
        ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
        if (this.kind === "superFreeze" || this.kind === "super" || this.kind === "ko" || this.kind === "finish") {
            const bar = 36 + (1 - t) * 10;
            ctx.fillStyle = `rgba(0, 0, 0, ${0.72 * t})`;
            ctx.fillRect(0, 0, GAME.WIDTH, bar);
            ctx.fillRect(0, GAME.HEIGHT - bar, GAME.WIDTH, bar);
        }
        if (this.frozen && (this.kind === "hit" || this.kind === "counter" || this.kind === "super" || this.kind === "ko")) {
            ctx.strokeStyle = `rgba(255, 250, 240, ${0.18 * t})`;
            ctx.lineWidth = 1;
            const cx = GAME.WIDTH / 2;
            const cy = GAME.HEIGHT / 2;
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2 + this.dir * 0.2;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 50);
                ctx.lineTo(cx + Math.cos(a) * 640, cy + Math.sin(a) * 360);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}
