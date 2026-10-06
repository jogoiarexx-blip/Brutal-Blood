import { GAME } from "../core/config.js";
export function drawFighter(ctx, f, sprites, shadows, debug = false, forceAnim, renderAlpha = 1, gfx = {}) {
    const rawAlpha = Math.max(0, Math.min(1, renderAlpha));
    // Physics stays fixed at 60 Hz. Only the render pose is eased between the
    // previous/current simulation states, so hitboxes and frame data never move.
    const alpha = gfx.motionSmoothing === false ? rawAlpha : smoothstep(rawAlpha);
    const rx = lerp(f.prevX ?? f.x, f.x, alpha);
    const ry = lerp(f.prevY ?? f.y, f.y, alpha);
    const renderFrame = f.attackFrame + alpha;
    const renderTime = f.stateTime + alpha * GAME.FRAME;
    const anim = forceAnim || mapAnim(f);
    if (shadows)
        drawGroundShadow(ctx, f, rx, ry);
    const visual = visualMotion(f, renderFrame, renderTime);
    const pivotX = rx + f.w / 2;
    const pivotY = ry + f.h;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.translate(visual.x, visual.y);
    ctx.rotate(visual.rotation);
    ctx.scale(visual.scaleX, visual.scaleY);
    ctx.translate(-pivotX, -pivotY);
    drawAfterimages(ctx, f, sprites, anim, rx, ry, renderTime, renderFrame, gfx.motionTrails === false ? 0 : visual.trail, gfx);
    const drawn = sprites?.draw(ctx, anim, rx, ry, f.w, f.h, f.facing, {
        time: renderTime,
        attack: f.attack,
        attackFrame: renderFrame,
        squash: f.impactSquash,
        frameBlend: gfx.frameBlend !== false,
    });
    if (!drawn) {
        ctx.save();
        ctx.translate(rx + f.w / 2, ry + f.h);
        const squash = f.impactSquash;
        ctx.scale(f.facing * (1 + squash * 0.18), 1 - squash * 0.2);
        ctx.translate(-f.w / 2, -f.h);
        if (f.state === "ko" || f.state === "knockdown") {
            ctx.translate(18, 135);
            ctx.rotate(-1.2);
            ctx.translate(-18, -135);
        }
        if (f.state === "crouch")
            ctx.translate(0, 28);
        if (f.state === "hit")
            ctx.translate(6, 0);
        if (f.data.id === "nyx")
            drawNyx(ctx, f);
        else if (f.data.id === "draven")
            drawDraven(ctx, f);
        else if (f.data.id === "vespera")
            drawVespera(ctx, f);
        else if (f.data.id === "gorr")
            drawGorr(ctx, f);
        else if (f.data.id === "shai")
            drawShai(ctx, f);
        else
            drawKharon(ctx, f);
        if (f.blocking) {
            ctx.strokeStyle = "#8ec8ff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(40, 70, 62, -1.15, 1.15);
            ctx.stroke();
        }
        if (f.hitFlash > 0) {
            ctx.globalCompositeOperation = "lighter";
            ctx.fillStyle = `rgba(255,240,230,${Math.min(0.7, f.hitFlash * 5)})`;
            ctx.fillRect(8, 4, 60, 140);
            ctx.globalCompositeOperation = "source-over";
        }
        ctx.restore();
    }
    else if (f.hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,240,230,${Math.min(0.55, f.hitFlash * 4)})`;
        ctx.fillRect(rx + 8, ry + 4, f.w - 16, f.h - 8);
        ctx.restore();
    }
    drawPowerAura(ctx, f, rx, ry, renderTime);
    ctx.restore();
    if (debug)
        sprites?.debug(ctx, f.x, f.y, f.w, f.h, f.facing);
}
function visualMotion(f, attackFrame, time) {
    const p = f.data.presentation ?? {};
    const anticipation = p.anticipation ?? 1;
    const snap = p.snap ?? 1;
    const trailBase = p.trail ?? 0;
    const bob = p.idleBob ?? 0.8;
    let x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1, trail = 0;
    if (f.state === "hit") {
        const decay = Math.max(0, 1 - time * 7);
        x = -f.facing * (5 + Math.sin(time * 70) * 3) * decay;
        y = Math.sin(time * 52) * 2.5 * decay;
        rotation = -f.facing * 0.025 * decay;
    }
    else if ((f.state === "attack" || f.state === "throw" || f.state === "counter") && f.attack) {
        const a = f.attack;
        const startup = Math.max(1, a.startup);
        const active = Math.max(1, a.active);
        const recovery = Math.max(1, a.recovery);
        if (attackFrame < startup) {
            const t = easeOutCubic(Math.max(0, attackFrame / startup));
            x = -f.facing * 5.5 * anticipation * t;
            rotation = -f.facing * 0.035 * anticipation * t;
            scaleX = 1 - 0.025 * anticipation * t;
            scaleY = 1 + 0.018 * anticipation * t;
        }
        else if (attackFrame < startup + active) {
            const t = Math.max(0, (attackFrame - startup) / active);
            const strike = 1 - Math.min(1, t * 0.85);
            x = f.facing * (7 + (a.advance ? 3 : 0)) * snap * strike;
            rotation = f.facing * 0.025 * snap * strike;
            scaleX = 1 + 0.045 * snap * strike;
            scaleY = 1 - 0.028 * snap * strike;
            trail = trailBase * (a.type === "super" ? 1.35 : a.type === "special" ? 1 : 0.48);
        }
        else {
            const t = Math.max(0, Math.min(1, (attackFrame - startup - active) / recovery));
            const settle = (1 - t) * (1 - t);
            x = f.facing * 4 * snap * settle;
            rotation = f.facing * 0.012 * snap * settle;
            trail = trailBase * 0.18 * settle;
        }
        if (a.grab)
            rotation *= 0.5;
        if (a.projectile)
            x *= 0.5;
        if (a.antiAir)
            y -= Math.sin(Math.min(1, attackFrame / Math.max(1, startup + active)) * Math.PI) * 4;
    }
    else if (f.state === "dash") {
        const pulse = 0.5 + 0.5 * Math.sin(time * 18);
        x = f.facing * (2.5 + pulse * 1.4);
        y = Math.sin(time * 22) * 1.3;
        rotation = f.facing * 0.012 * pulse;
        scaleX = 1.025 + pulse * 0.012;
        scaleY = 0.985 - pulse * 0.008;
        trail = trailBase * 0.9;
    }
    else if (f.state === "jump") {
        const rising = Math.max(-1, Math.min(1, -(f.vy ?? 0) / 650));
        y = -Math.abs(rising) * 2.2;
        rotation = f.facing * rising * 0.035;
        scaleX = 1 - Math.abs(rising) * 0.018;
        scaleY = 1 + Math.abs(rising) * 0.025;
    }
    else if (f.state === "crouch") {
        scaleX = 1.035;
        scaleY = 0.965;
        y = 2.2;
    }
    else if (f.state === "block") {
        const brace = 0.5 + 0.5 * Math.sin(time * 11);
        x = -f.facing * (1.2 + brace * 0.8);
        rotation = -f.facing * 0.012;
        scaleX = 0.99;
        scaleY = 1.008;
    }
    else if (f.state === "wakeup") {
        const t = easeOutCubic(Math.min(1, time / 0.34));
        y = (1 - t) * 7;
        rotation = -f.facing * (1 - t) * 0.035;
        scaleX = 1.04 - t * 0.04;
        scaleY = 0.94 + t * 0.06;
    }
    else if (f.state === "idle" || f.state === "walk" || f.state === "walkBack") {
        const walk = f.state !== "idle";
        y = Math.sin(time * (walk ? 9.5 : 5.2)) * bob;
        if (walk) {
            const step = Math.sin(time * 9.5);
            rotation = f.facing * step * 0.006;
            scaleY = 1 + Math.abs(step) * 0.006;
        }
    }
    if (f.hasStatus?.("bloodRush")) {
        scaleX *= 1.01 + Math.sin(time * 13) * 0.008;
        scaleY *= 1.01 - Math.sin(time * 13) * 0.006;
        trail = Math.max(trail, 0.16);
    }
    return { x, y, rotation, scaleX, scaleY, trail };
}
function drawAfterimages(ctx, f, sprites, anim, x, y, time, attackFrame, amount, gfx = {}) {
    if (!sprites || amount <= 0.04)
        return;
    const copies = amount > 0.5 ? 2 : 1;
    for (let i = copies; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.18, amount * (i === 1 ? 0.22 : 0.13));
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(-f.facing * (5 + i * 6) * amount, i * 0.6);
        sprites.draw(ctx, anim, x, y, f.w, f.h, f.facing, {
            time: Math.max(0, time - i * 0.025),
            attack: f.attack,
            attackFrame: Math.max(0, attackFrame - i * 0.7),
            squash: 0,
            frameBlend: gfx.frameBlend !== false,
        });
        ctx.restore();
    }
}
function drawPowerAura(ctx, f, x, y, time) {
    const labels = f.statusLabels?.() ?? [];
    if (!labels.length)
        return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.14 + Math.sin(time * 9) * 0.035;
    ctx.strokeStyle = f.data.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + f.w / 2, y + f.h * 0.55, 34 + Math.sin(time * 7) * 2, 72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
function easeOutCubic(t) {
    return 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
}
function smoothstep(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
}
function lerp(a, b, t) {
    return a + (b - a) * t;
}
function drawGroundShadow(ctx, f, x = f.x, y = f.y) {
    const height = Math.max(0, GAME.FLOOR - (y + f.h));
    const air = Math.min(1, height / 260);
    ctx.save();
    ctx.globalAlpha = 0.42 - air * 0.2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x + f.w / 2, GAME.FLOOR - 4, 31 - air * 11, 8 - air * 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function mapAnim(f) {
    if (f.state === "attack" && f.attack)
        return f.attack.id;
    if (f.state === "walkBack")
        return "walkBack";
    if (f.state === "block" && f.crouching)
        return "blockLow";
    if (f.state === "jump")
        return f.vy > 60 ? "fall" : f.stateTime < 0.08 ? "jumpStart" : "jump";
    if (f.state === "hit" && f.lastHitWasCounter)
        return "hitHeavy";
    if (f.state === "ko")
        return "knockdown";
    if (f.state === "finish")
        return f.attack?.id === "finish2" ? "finish2" : "finish1";
    return f.state;
}
function drawKharon(ctx, f) {
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = c;
    ctx.shadowColor = f.data.color;
    ctx.shadowBlur = 16;
    ctx.fillRect(16, 36, 46, 78);
    ctx.beginPath();
    ctx.arc(40, 22, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1a1014";
    ctx.fillRect(14, 12, 52, 10);
    ctx.fillRect(8, 112, 24, 40);
    ctx.fillRect(46, 112, 24, 40);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(20, 52, 38, 7);
    ctx.save();
    ctx.translate(58, 50);
    ctx.rotate(-0.5 + swing);
    ctx.fillStyle = "#2a1a1c";
    ctx.fillRect(0, -4, 78, 7);
    ctx.fillStyle = "#d0d4dc";
    ctx.beginPath();
    ctx.moveTo(70, -16);
    ctx.lineTo(108, 0);
    ctx.lineTo(70, 16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#3a2024";
    ctx.fillRect(22, 36, 34, 14);
}
function drawNyx(ctx, f) {
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = c;
    ctx.shadowColor = f.data.accent;
    ctx.shadowBlur = 18;
    ctx.fillRect(22, 34, 32, 80);
    ctx.beginPath();
    ctx.arc(38, 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#120c18";
    ctx.fillRect(18, 14, 22, 8);
    ctx.fillRect(14, 112, 18, 38);
    ctx.fillRect(44, 112, 18, 38);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(26, 48, 24, 4);
    ctx.save();
    ctx.translate(50, 58);
    ctx.rotate(-0.2 + swing);
    ctx.fillStyle = "#c8c0d8";
    ctx.fillRect(0, -2, 64, 4);
    ctx.beginPath();
    ctx.moveTo(60, -8);
    ctx.lineTo(86, 0);
    ctx.lineTo(60, 8);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(18, 62);
    ctx.rotate(0.6 - swing * 0.6);
    ctx.fillStyle = "#c8c0d8";
    ctx.fillRect(0, -2, 50, 4);
    ctx.restore();
}
function drawDraven(ctx, f) {
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = c;
    ctx.shadowColor = "#4a3028";
    ctx.shadowBlur = 14;
    ctx.fillRect(12, 40, 54, 72);
    ctx.beginPath();
    ctx.arc(40, 24, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1c1410";
    ctx.fillRect(10, 112, 26, 40);
    ctx.fillRect(42, 112, 26, 40);
    ctx.fillStyle = "#3a2a22";
    ctx.fillRect(16, 46, 46, 18);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(22, 64, 34, 6);
    ctx.save();
    ctx.translate(62, 58);
    ctx.rotate(-0.15 + swing);
    ctx.fillStyle = "#c8b49a";
    ctx.fillRect(0, -10, 22, 20);
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(16, -12, 10, 24);
    ctx.restore();
    ctx.save();
    ctx.translate(10, 70);
    ctx.rotate(0.35 - swing * 0.5);
    ctx.fillStyle = "#c8b49a";
    ctx.fillRect(-18, -8, 22, 18);
    ctx.fillStyle = "#6a5a4a";
    ctx.fillRect(-26, -10, 10, 22);
    ctx.restore();
}
function drawVespera(ctx, f) {
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = c;
    ctx.shadowColor = f.data.accent;
    ctx.shadowBlur = 20;
    ctx.fillRect(20, 38, 38, 84);
    ctx.beginPath();
    ctx.arc(39, 22, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#2a0814";
    ctx.fillRect(16, 14, 46, 8);
    ctx.fillRect(18, 114, 16, 36);
    ctx.fillRect(44, 114, 16, 36);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(24, 50, 30, 5);
    ctx.beginPath();
    ctx.moveTo(28, 12);
    ctx.lineTo(39, -6);
    ctx.lineTo(50, 12);
    ctx.fill();
    ctx.save();
    ctx.translate(56, 52);
    ctx.rotate(-0.4 + swing * 0.5);
    ctx.fillStyle = "#e35a7a";
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(40, 0, 36 + swing * 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
function drawGorr(ctx, f) {
    // Identity lock: long hair + heavy armor + greatsword. Never bald/shirtless.
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = "#241610";
    ctx.fillRect(10, 108, 26, 42);
    ctx.fillRect(42, 108, 26, 42);
    ctx.fillStyle = c;
    ctx.shadowColor = f.data.accent;
    ctx.shadowBlur = 12;
    ctx.fillRect(8, 38, 60, 76);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6a4a32";
    ctx.fillRect(0, 36, 24, 24);
    ctx.fillRect(52, 36, 24, 24);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(14, 64, 48, 8);
    ctx.fillStyle = "#c4a07a";
    ctx.beginPath();
    ctx.arc(38, 22, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1210";
    ctx.beginPath();
    ctx.moveTo(20, 14);
    ctx.lineTo(12, 86);
    ctx.lineTo(24, 88);
    ctx.lineTo(28, 26);
    ctx.lineTo(38, 6);
    ctx.lineTo(56, 16);
    ctx.lineTo(66, 84);
    ctx.lineTo(54, 86);
    ctx.lineTo(50, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(28, 28, 18, 16);
    ctx.save();
    ctx.translate(62, 46);
    ctx.rotate(-0.55 + swing);
    ctx.fillStyle = "#3a2a20";
    ctx.fillRect(-6, -10, 18, 16);
    ctx.fillStyle = "#c8c4bc";
    ctx.fillRect(10, -12, 94, 18);
    ctx.fillStyle = "#e8e4dc";
    ctx.fillRect(18, -6, 78, 5);
    ctx.restore();
}
function drawShai(ctx, f) {
    const c = f.hitFlash > 0 ? "#fff" : f.data.color;
    const swing = attackSwing(f);
    ctx.fillStyle = c;
    ctx.shadowColor = f.data.accent;
    ctx.shadowBlur = 16;
    ctx.fillRect(22, 34, 34, 82);
    ctx.beginPath();
    ctx.arc(39, 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#160d12";
    ctx.fillRect(18, 112, 18, 40);
    ctx.fillRect(44, 112, 18, 40);
    ctx.save();
    ctx.translate(54, 58);
    ctx.rotate(-0.35 + swing);
    ctx.fillStyle = "#d8d8e0";
    ctx.fillRect(0, -2, 72, 4);
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(60, -5, 22, 10);
    ctx.restore();
}
function attackSwing(f) {
    if (f.state !== "attack" || !f.attack)
        return f.state === "walk" ? Math.sin(f.stateTime * 10) * 0.12 : 0;
    const p = Math.min(1, f.attackFrame / Math.max(1, f.attack.startup + f.attack.active));
    return Math.sin(p * Math.PI) * (f.attack.type === "special" || f.attack.type === "super" ? 1.4 : 0.9);
}
export function drawHitboxes(ctx, f) {
    const hurt = f.getHurtBox();
    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 1;
    ctx.strokeRect(hurt.x, hurt.y, hurt.w, hurt.h);
    const atk = f.getAttackBox();
    if (atk) {
        ctx.strokeStyle = "#f87171";
        ctx.strokeRect(atk.x, atk.y, atk.w, atk.h);
    }
}
