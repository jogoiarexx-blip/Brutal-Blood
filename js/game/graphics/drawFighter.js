import { GAME } from "../core/config.js";
export function drawFighter(ctx, f, sprites, shadows, debug = false, forceAnim) {
    const anim = forceAnim || mapAnim(f);
    if (shadows)
        drawGroundShadow(ctx, f);
    const visual = visualOffset(f);
    ctx.save();
    ctx.translate(visual.x, visual.y);
    const drawn = sprites?.draw(ctx, anim, f.x, f.y, f.w, f.h, f.facing, {
        time: f.stateTime,
        attack: f.attack,
        attackFrame: f.attackFrame,
        squash: f.impactSquash,
    });
    if (!drawn) {
        ctx.save();
        ctx.translate(f.x + f.w / 2, f.y + f.h);
        const squash = f.impactSquash;
        ctx.scale(f.facing * f.scaleX * (1 + squash * 0.18), f.scaleY * (1 - squash * 0.2));
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
        ctx.fillRect(f.x + 8, f.y + 4, f.w - 16, f.h - 8);
        ctx.restore();
    }
    ctx.restore();
    if (debug)
        sprites?.debug(ctx, f.x, f.y, f.w, f.h, f.facing);
}
function visualOffset(f) {
    if (f.state === "hit") {
        const decay = Math.max(0, 1 - f.stateTime * 7);
        return {
            x: -f.facing * (5 + Math.sin(f.stateTime * 70) * 3) * decay,
            y: Math.sin(f.stateTime * 52) * 2.5 * decay,
        };
    }
    if (f.state === "attack" && f.attack) {
        const total = Math.max(1, f.attack.startup + f.attack.active);
        const p = Math.min(1, f.attackFrame / total);
        const weight = f.attack.type === "super" ? 5 : f.attack.button === "heavy" || f.attack.button === "kickHeavy" ? 3.5 : 1.5;
        return { x: f.facing * Math.sin(p * Math.PI) * weight, y: 0 };
    }
    return { x: 0, y: 0 };
}
function drawGroundShadow(ctx, f) {
    const height = Math.max(0, GAME.FLOOR - (f.y + f.h));
    const air = Math.min(1, height / 260);
    ctx.save();
    ctx.globalAlpha = 0.42 - air * 0.2;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2, GAME.FLOOR - 4, 31 - air * 11, 8 - air * 2.5, 0, 0, Math.PI * 2);
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
