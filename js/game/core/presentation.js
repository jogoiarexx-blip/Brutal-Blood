import { GAME } from "./config.js";
/**
 * Pure presentation layer. Nothing here changes collision, frame data or movement.
 * The goal is the dense arcade-fighter cadence: layered stage, readable danger state,
 * round wipes and stronger hit punctuation without importing third-party game assets.
 */
export function drawFightAtmosphere(ctx, opts) {
    if (!opts.effects)
        return;
    const p1 = opts.p1Max > 0 ? opts.p1Health / opts.p1Max : 1;
    const p2 = opts.p2Max > 0 ? opts.p2Health / opts.p2Max : 1;
    const danger = Math.max(0, 1 - Math.min(p1, p2) / 0.26);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Constant edge shaping makes the arena feel less like a flat canvas.
    const vignette = ctx.createRadialGradient(GAME.WIDTH / 2, GAME.HEIGHT * 0.46, GAME.HEIGHT * 0.2, GAME.WIDTH / 2, GAME.HEIGHT * 0.48, GAME.WIDTH * 0.7);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.68, "rgba(0,0,0,0.04)");
    vignette.addColorStop(1, `rgba(0,0,0,${0.28 + danger * 0.1})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    if (danger > 0.02 && opts.state === "fight") {
        const pulse = opts.reduceFlashes ? 0.65 : 0.72 + Math.sin(opts.time * 5.2) * 0.28;
        const a = danger * pulse * 0.16;
        const red = ctx.createRadialGradient(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH * 0.28, GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH * 0.72);
        red.addColorStop(0, "rgba(120,0,12,0)");
        red.addColorStop(1, `rgba(120,0,12,${a})`);
        ctx.fillStyle = red;
        ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    }
    if (opts.state === "intro")
        drawIntroWipe(ctx, opts.stateTime);
    if (opts.state === "finish")
        drawFinishFrame(ctx, opts.stateTime);
    if (opts.state === "roundend" || opts.state === "ended")
        drawRoundEndShade(ctx, opts.stateTime);
    ctx.restore();
}
function drawIntroWipe(ctx, t) {
    const reveal = smoothstep(0.08, 0.72, t);
    const fight = smoothstep(1.08, 1.72, t) * (1 - smoothstep(1.9, 2.1, t));
    const bar = 64 * (1 - reveal) + 18;
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, GAME.WIDTH, bar);
    ctx.fillRect(0, GAME.HEIGHT - bar, GAME.WIDTH, bar);
    if (fight > 0) {
        const width = GAME.WIDTH * (0.18 + fight * 0.82);
        const x = (GAME.WIDTH - width) / 2;
        const g = ctx.createLinearGradient(x, 0, x + width, 0);
        g.addColorStop(0, "rgba(150,10,20,0)");
        g.addColorStop(0.5, `rgba(150,10,20,${0.16 * fight})`);
        g.addColorStop(1, "rgba(150,10,20,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, GAME.HEIGHT * 0.39, width, GAME.HEIGHT * 0.22);
    }
}
function drawFinishFrame(ctx, t) {
    const k = Math.min(1, t * 2.2);
    ctx.fillStyle = `rgba(34,0,4,${0.18 + k * 0.16})`;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    const bar = 34 + k * 30;
    ctx.fillStyle = `rgba(0,0,0,${0.5 + k * 0.2})`;
    ctx.fillRect(0, 0, GAME.WIDTH, bar);
    ctx.fillRect(0, GAME.HEIGHT - bar, GAME.WIDTH, bar);
}
function drawRoundEndShade(ctx, t) {
    const k = Math.min(1, t * 2.5);
    ctx.fillStyle = `rgba(0,0,0,${0.08 + k * 0.12})`;
    ctx.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
}
function smoothstep(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / Math.max(0.0001, b - a)));
    return t * t * (3 - 2 * t);
}
