import { GAME } from "./config.js";
export class Camera {
    x = 0;
    y = 0;
    zoom = 1;
    targetX = 0;
    targetZoom = 1;
    trauma = 0;
    zoomBoost = 0;
    shakeMul = 1;
    impulseX = 0;
    bounds = { w: GAME.WIDTH, h: GAME.HEIGHT };
    setShake(enabled) {
        this.shakeMul = enabled ? 1 : 0;
    }
    addTrauma(v) {
        this.trauma = Math.min(1, this.trauma + v * this.shakeMul);
    }
    punch(zoom = 1.12) {
        this.zoomBoost = Math.max(this.zoomBoost, Math.min(.18, Math.max(.04, zoom - 1)));
    }
    /** Directional kick opposite the hit, lerps back. */
    kick(dir, mag = 10) {
        this.impulseX += dir * mag * this.shakeMul;
    }
    reset() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.trauma = 0;
        this.zoomBoost = 0;
        this.impulseX = 0;
    }
    follow(ax, bx, cinematic = false) {
        const left = Math.min(ax, bx) - 36;
        const right = Math.max(ax, bx) + 112;
        const mid = (left + right) / 2;
        const dist = right - left;
        const z = cinematic ? 1.14 : dist < 240 ? 1.1 : dist > 680 ? 1.0 : 1.05;
        this.targetZoom = z;
        this.targetX = Math.max(-40, Math.min(40, mid - GAME.WIDTH / 2));
    }
    update(dt) {
        const k = 1 - Math.exp(-7.2 * dt);
        this.x += (this.targetX - this.x) * k;
        this.zoom += (this.targetZoom + this.zoomBoost - this.zoom) * (1 - Math.exp(-5.4 * dt));
        this.zoomBoost *= Math.exp(-5 * dt);
        this.trauma = Math.max(0, this.trauma - dt * 2.2);
        this.impulseX += (0 - this.impulseX) * (1 - Math.exp(-10 * dt));
    }
    apply(ctx) {
        const shake = this.trauma * this.trauma;
        const ox = this.x + this.impulseX + (Math.random() * 2 - 1) * 8 * shake;
        const oy = (Math.random() * 2 - 1) * 5 * shake;
        const rot = (Math.random() * 2 - 1) * 0.006 * shake;
        ctx.translate(GAME.WIDTH / 2, GAME.FLOOR - 80);
        ctx.rotate(rot);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-GAME.WIDTH / 2 - ox, -(GAME.FLOOR - 80) - oy);
    }
}
