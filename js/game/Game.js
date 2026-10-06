import { GAME } from "./core/config.js";
import { get2dContext } from "./core/graphics.js";
import { getSave } from "./core/save.js";
import { Match } from "./combat/Match.js";
export class Game {
    canvas;
    ctx;
    match;
    input;
    raf = 0;
    last = 0;
    acc = 0;
    lastDraw = 0;
    running = false;
    onVis;
    onBlur;
    constructor(opts) {
        this.canvas = opts.canvas;
        const save = getSave();
        this.ctx = get2dContext(opts.canvas, save.graphics.accel);
        this.input = opts.input;
        this.match = new Match({
            ctx: this.ctx,
            input: opts.input,
            p1Data: opts.p1,
            p2Data: opts.p2,
            mode: opts.mode,
            difficulty: opts.difficulty,
            stageId: opts.stageId,
            gfx: save.graphics,
            audio: opts.audio,
            onHUD: opts.onHUD,
            onMatchEnd: opts.onMatchEnd,
            winsNeeded: opts.winsNeeded,
            runLabel: opts.runLabel,
            carry: opts.carry,
            assets: opts.assets ?? null,
            p1Palette: opts.p1Palette,
            p2Palette: opts.p2Palette,
        });
        this.match.onPause = opts.onPause;
        this.wireControlsTest();
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.last = performance.now();
        this.acc = 0;
        const loop = (now) => {
            if (!this.running)
                return;
            const dt = Math.min(GAME.MAX_DT, (now - this.last) / 1000);
            this.last = now;
            this.acc += dt;
            this.input.poll();
            let steps = 0;
            while (this.acc >= GAME.FRAME && steps < 5) {
                this.match.step();
                this.input.endFrame();
                this.acc -= GAME.FRAME;
                steps++;
            }
            const maxFps = getSave().graphics.maxFps;
            const minDraw = 1000 / maxFps;
            if (now - this.lastDraw >= minDraw - 0.5) {
                this.match.draw();
                this.lastDraw = now;
            }
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
        this.onBlur = () => {
            this.input.clearAll();
            this.acc = 0;
            if (this.match.state !== "ended")
                this.match.togglePause(true);
        };
        this.onVis = () => {
            if (document.hidden)
                this.onBlur?.();
            this.last = performance.now();
            this.acc = 0;
        };
        window.addEventListener("blur", this.onBlur);
        document.addEventListener("visibilitychange", this.onVis);
    }
    setTraining(t) {
        this.match.applyTraining(t);
    }
    destroy() {
        this.running = false;
        this.match.dispose();
        if (this.onBlur)
            window.removeEventListener("blur", this.onBlur);
        cancelAnimationFrame(this.raf);
        if (this.onVis)
            document.removeEventListener("visibilitychange", this.onVis);
        if (typeof window !== "undefined")
            delete window.__controlsTest;
    }
    wireControlsTest() {
        if (typeof window === "undefined")
            return;
        window.__controlsTest = {
            getYaw: () => this.match.p1.x,
            getSpeed: () => Math.abs(this.match.p1.vx),
            getX: () => this.match.p1.x,
            getHitstop: () => this.match.hitStop.remaining,
            getLastHitstop: () => this.match.hitStop.lastFrames,
            getHitstopKind: () => this.match.hitStop.kind,
            getSpriteReady: () => this.match.sprites[0]?.ready ?? false,
            getSpriteCount: () => this.match.sprites[0]?.pack?.images.size ?? 0,
            getSpriteAnim: () => this.match.sprites[0]?.lastAnim ?? "",
            getSpriteSrc: () => this.match.sprites[0]?.lastSrc ?? "",
            getSpriteFallback: () => this.match.sprites[0]?.lastFallback ?? false,
            getSpriteMode: () => this.match.sprites[0]?.lastMode ?? "",
            getPalette: () => `${this.match.p1.paletteId}/${this.match.p2.paletteId}`,
            getFacing: () => this.match.p1.facing,
            killP2: () => { this.match.p2.health = 0; },
            setKeys: (codes) => this.input.injectCodes(codes),
            setSteer: (v) => {
                const codes = [];
                if (v > 0.2)
                    codes.push("KeyA");
                if (v < -0.2)
                    codes.push("KeyD");
                this.input.injectCodes(codes);
            },
        };
    }
}
