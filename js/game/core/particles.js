const POOL = 320;
export class ParticlePool {
    list = [];
    i = 0;
    enabled = true;
    constructor() {
        for (let n = 0; n < POOL; n++) {
            this.list.push({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, max: 1, size: 2, color: "#fff", gravity: 0,
                kind: "spark", drag: 0, spin: 0,
            });
        }
    }
    take() {
        const p = this.list[this.i];
        this.i = (this.i + 1) % POOL;
        return p;
    }
    /** Compatibility emitter used by existing specials and finishes. */
    spawn(x, y, n, color, spark = true) {
        if (!this.enabled)
            return;
        for (let k = 0; k < n; k++) {
            const p = this.take();
            const a = Math.random() * Math.PI * 2;
            const sp = 80 + Math.random() * 340;
            p.x = x;
            p.y = y;
            p.vx = Math.cos(a) * sp;
            p.vy = Math.sin(a) * sp - 80;
            p.life = p.max = 0.25 + Math.random() * 0.45;
            p.size = spark ? 2 + Math.random() * 3 : 6 + Math.random() * 10;
            p.color = color;
            p.gravity = spark ? 600 : 80;
            p.kind = spark ? "spark" : "orb";
            p.drag = spark ? 0.8 : 1.5;
            p.spin = 0;
        }
    }
    /** Directional hit burst: sparks + elongated impact streaks instead of a flat radial puff. */
    impact(x, y, dir, power, color) {
        if (!this.enabled)
            return;
        const d = dir || 1;
        const count = Math.max(6, Math.round(7 + power * 10));
        for (let k = 0; k < count; k++) {
            const p = this.take();
            const spread = (Math.random() - 0.5) * 1.45;
            const a = (d > 0 ? 0 : Math.PI) + spread;
            const sp = 170 + Math.random() * (250 + power * 190);
            p.x = x + (Math.random() - 0.5) * 10;
            p.y = y + (Math.random() - 0.5) * 14;
            p.vx = Math.cos(a) * sp;
            p.vy = Math.sin(a) * sp - 30 - Math.random() * 60;
            p.life = p.max = 0.12 + Math.random() * 0.2;
            p.size = 2 + Math.random() * (2 + power * 3);
            p.color = Math.random() > 0.28 ? color : "#fff1de";
            p.gravity = 420;
            p.kind = k % 3 === 0 ? "streak" : "spark";
            p.drag = 1.2;
            p.spin = 0;
        }
    }
    blood(x, y, n) {
        this.bloodBurst(x, y, 1, Math.max(0.35, n / 20));
    }
    /** Blood fountain/splat style burst with directional droplets and a short mist layer. */
    bloodBurst(x, y, dir, power = 0.65) {
        if (!this.enabled)
            return;
        const d = dir || 1;
        const drops = Math.max(5, Math.round(7 + power * 13));
        for (let k = 0; k < drops; k++) {
            const p = this.take();
            const a = (d > 0 ? -0.45 : Math.PI + 0.45) + (Math.random() - 0.5) * 1.5;
            const sp = 95 + Math.random() * (150 + power * 230);
            p.x = x + (Math.random() - 0.5) * 8;
            p.y = y + (Math.random() - 0.5) * 10;
            p.vx = Math.cos(a) * sp;
            p.vy = Math.sin(a) * sp - 110 - Math.random() * 80;
            p.life = p.max = 0.32 + Math.random() * 0.48;
            p.size = 2 + Math.random() * (2 + power * 4);
            p.color = Math.random() > 0.35 ? "#c9202b" : "#781018";
            p.gravity = 1050;
            p.kind = k % 4 === 0 ? "streak" : "blood";
            p.drag = 0.25;
            p.spin = (Math.random() - 0.5) * 6;
        }
        const mist = Math.max(2, Math.round(2 + power * 5));
        for (let k = 0; k < mist; k++) {
            const p = this.take();
            p.x = x + (Math.random() - 0.5) * 18;
            p.y = y + (Math.random() - 0.5) * 16;
            p.vx = d * (20 + Math.random() * 80) + (Math.random() - 0.5) * 40;
            p.vy = -25 - Math.random() * 70;
            p.life = p.max = 0.18 + Math.random() * 0.24;
            p.size = 10 + Math.random() * (10 + power * 12);
            p.color = "#941520";
            p.gravity = 40;
            p.kind = "mist";
            p.drag = 4;
            p.spin = 0;
        }
    }
    dust(x, y, n, dir = 0) {
        if (!this.enabled)
            return;
        for (let k = 0; k < n; k++) {
            const p = this.take();
            p.x = x + (Math.random() - 0.5) * 30;
            p.y = y - Math.random() * 5;
            p.vx = dir * (25 + Math.random() * 70) + (Math.random() - 0.5) * 120;
            p.vy = -25 - Math.random() * 100;
            p.life = p.max = 0.3 + Math.random() * 0.45;
            p.size = 5 + Math.random() * 9;
            p.color = Math.random() > 0.5 ? "#66545a" : "#3d3438";
            p.gravity = 150;
            p.kind = "dust";
            p.drag = 2.8;
            p.spin = 0;
        }
    }
    ember(x, y, n) {
        if (!this.enabled)
            return;
        for (let k = 0; k < n; k++) {
            const p = this.take();
            p.x = x + (Math.random() * 40 - 20);
            p.y = y;
            p.vx = (Math.random() - 0.5) * 30;
            p.vy = -40 - Math.random() * 80;
            p.life = p.max = 0.8 + Math.random() * 1.2;
            p.size = 2 + Math.random() * 2;
            p.color = Math.random() > 0.5 ? "#e25a3a" : "#f0a060";
            p.gravity = -40;
            p.kind = "ember";
            p.drag = 0.35;
            p.spin = 0;
        }
    }
    update(dt) {
        for (const p of this.list) {
            if (p.life <= 0)
                continue;
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            const drag = Math.max(0, 1 - p.drag * dt);
            p.vx *= drag;
            p.vy *= p.kind === "mist" || p.kind === "dust" ? drag : 1;
        }
    }
    draw(ctx) {
        ctx.save();
        for (const p of this.list) {
            if (p.life <= 0)
                continue;
            const a = Math.max(0, p.life / p.max);
            ctx.globalAlpha = a;
            ctx.fillStyle = p.color;
            ctx.strokeStyle = p.color;
            if (p.kind === "streak") {
                const len = Math.max(8, Math.min(34, Math.hypot(p.vx, p.vy) * 0.055));
                const mag = Math.max(1, Math.hypot(p.vx, p.vy));
                const nx = p.vx / mag, ny = p.vy / mag;
                ctx.lineWidth = Math.max(1, p.size * 0.7 * a);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - nx * len, p.y - ny * len);
                ctx.stroke();
            }
            else if (p.kind === "spark" || p.kind === "ember") {
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
            else if (p.kind === "dust" || p.kind === "mist") {
                ctx.globalAlpha = a * (p.kind === "mist" ? 0.24 : 0.34);
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, p.size * (1.25 - a * 0.2), p.size * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                ctx.beginPath();
                const stretch = p.kind === "blood" ? 1 + Math.min(1.8, Math.abs(p.vy) / 260) : 1;
                ctx.ellipse(p.x, p.y, Math.max(1, p.size * a), Math.max(1, p.size * a * stretch), p.spin * (1 - a), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}
