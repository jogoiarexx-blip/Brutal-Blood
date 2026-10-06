import { DEFAULT_PALETTES, isIdentityPalette, paletteFilter } from "../assets/palettes.js";
const layoutWarned = new Set();
const tintCache = new Map();
/**
 * Draws preloaded sheets. Combat boxes stay on Fighter.
 * Facing left uses ctx.scale(-1,1) — never duplicate art.
 * Missing clip/src → draw() returns false (placeholder).
 */
export class SpriteAnimator {
    ready = false;
    id;
    pack;
    palette;
    lastAnim = "idle";
    lastFrame = 0;
    lastSrc = "";
    lastFallback = false;
    lastMode = "CANVAS";
    lastType = "CANVAS";
    currentAnim = "";
    lastMoveId = "";
    animOrigin = 0;
    skin = "default";
    constructor(id, pack = null, palette, skin = "default") {
        this.id = id;
        this.pack = pack;
        this.palette = palette ?? DEFAULT_PALETTES[0];
        this.skin = skin;
        this.ready = !!pack && pack.images.size > 0;
    }
    clip(name) {
        if (!this.pack)
            return undefined;
        return this.pack.clips[name] ?? this.pack.clips.idle;
    }
    resolve(name) {
        if (!this.pack)
            return null;
        const start = this.clip(name);
        if (!start)
            return null;
        const dedicated = this.tryDedicated(start, "DEDICATED");
        if (dedicated)
            return dedicated;
        const seen = new Set([start.name]);
        let cur = start.fallback ? this.pack.clips[start.fallback] : undefined;
        while (cur && !seen.has(cur.name)) {
            seen.add(cur.name);
            const fromClip = this.tryDedicated(cur, "CLIP_FALLBACK");
            if (fromClip)
                return fromClip;
            cur = cur.fallback ? this.pack.clips[cur.fallback] : undefined;
        }
        const group = this.tryGroup(start, "GROUP_FALLBACK");
        if (group)
            return group;
        cur = start.fallback ? this.pack.clips[start.fallback] : undefined;
        seen.clear();
        seen.add(start.name);
        while (cur && !seen.has(cur.name)) {
            seen.add(cur.name);
            const fromGroup = this.tryGroup(cur, "GROUP_FALLBACK");
            if (fromGroup)
                return fromGroup;
            cur = cur.fallback ? this.pack.clips[cur.fallback] : undefined;
        }
        return null;
    }
    tryDedicated(clip, mode) {
        if (!clip.src || !this.pack)
            return null;
        const img = this.pack.images.get(clip.src);
        if (!img)
            return null;
        const cols = Math.max(1, clip.columns || clip.frames);
        const rows = Math.max(1, clip.rows ?? 1);
        const layout = clampLayout(clip.src, clip.frames, cols, rows, "DEDICATED");
        return {
            clip,
            src: clip.src,
            image: img,
            ...layout,
            fps: clip.fps,
            mode,
            mask: clip.maskSrc ? this.pack.images.get(clip.maskSrc) : undefined,
        };
    }
    tryGroup(clip, mode) {
        if (!clip.fallbackSrc || !this.pack)
            return null;
        const img = this.pack.images.get(clip.fallbackSrc);
        if (!img)
            return null;
        const frames = Math.max(1, clip.sheetFrames || 1);
        const cols = Math.max(1, clip.sheetColumns || frames);
        const rows = Math.max(1, clip.sheetRows ?? 1);
        const layout = clampLayout(clip.fallbackSrc, frames, cols, rows, "GROUP");
        return {
            clip,
            src: clip.fallbackSrc,
            image: img,
            ...layout,
            fps: clip.sheetFps || clip.fps,
            mode,
        };
    }
    draw(ctx, anim, x, y, w, h, facing, timeOrOpts) {
        const opts = typeof timeOrOpts === "number" ? { time: timeOrOpts } : timeOrOpts;
        const resolved = this.resolve(anim);
        if (!resolved) {
            this.lastAnim = anim;
            this.lastMode = "CANVAS";
            this.lastType = "CANVAS";
            this.lastFallback = true;
            return false;
        }
        const moveId = opts.attack?.id ?? "";
        if (anim !== this.currentAnim || moveId !== this.lastMoveId) {
            this.currentAnim = anim;
            this.lastMoveId = moveId;
            this.animOrigin = opts.time;
        }
        const localTime = Math.max(0, opts.time - this.animOrigin);
        // Timing belongs to the move that was requested. Pixels may come from a borrowed sheet.
        const driver = this.clip(anim) ?? resolved.clip;
        const n = resolved.frames;
        const i = pickFrame(driver, n, localTime, driver.fps || resolved.fps, opts);
        this.lastAnim = anim;
        this.lastFrame = i;
        this.lastSrc = resolved.src;
        this.lastMode = resolved.mode;
        this.lastFallback = resolved.mode !== "DEDICATED";
        this.lastType = resolved.mode === "DEDICATED" ? "DEDICATED" : resolved.mode === "CLIP_FALLBACK" ? "CLIP" : "GROUP";
        const cols = resolved.columns;
        const rows = resolved.rows;
        const pixels = this.sheetForDraw(resolved);
        const iw = imageWidth(pixels);
        const ih = imageHeight(pixels);
        if (!iw || !ih)
            return false;
        const frameW = iw / cols;
        const frameH = ih / rows;
        const col = i % cols;
        const row = Math.min(rows - 1, driver.row ?? resolved.clip.row ?? Math.floor(i / cols));
        const sx = col * frameW;
        const sy = row * frameH;
        const visScale = (driver.scale ?? resolved.clip.scale ?? 1) * (h / frameH);
        const squash = opts.squash ?? 0;
        const sxScale = visScale * (1 + squash * 0.16);
        const syScale = visScale * (1 - squash * 0.18);
        const px = driver.pivotX * frameW;
        const py = driver.pivotY * frameH;
        const ox = driver.offsetX ?? resolved.clip.offsetX ?? 0;
        const oy = driver.offsetY ?? resolved.clip.offsetY ?? 0;
        ctx.save();
        ctx.translate(x + w / 2 + ox * facing, y + h + oy);
        ctx.scale(facing, 1);
        if (!resolved.mask && !isIdentityPalette(this.palette)) {
            // Full-image palette fallback when no maskSrc is loaded.
            ctx.filter = paletteFilter(this.palette);
        }
        ctx.drawImage(pixels, sx, sy, frameW, frameH, -px * sxScale, -py * syScale, frameW * sxScale, frameH * syScale);
        ctx.filter = "none";
        ctx.restore();
        return true;
    }
    sheetForDraw(resolved) {
        if (!resolved.mask || isIdentityPalette(this.palette))
            return resolved.image;
        return tintWithMask(this.skin, resolved.src, resolved.clip.maskSrc ?? "", this.palette, resolved.image, resolved.mask);
    }
    debug(ctx, x, y, w, h, facing) {
        ctx.save();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff8f0";
        ctx.font = "10px monospace";
        const file = this.lastSrc.split("/").pop() ?? this.lastSrc;
        ctx.fillText(`ANIM: ${this.lastAnim}  FRAME: ${this.lastFrame}`, x, y - 42);
        ctx.fillText(`SOURCE: ${file || "canvas"}`, x, y - 30);
        ctx.fillText(`MODE: ${this.lastMode}`, x, y - 18);
        ctx.fillText(`TYPE: ${this.lastType}  PAL: ${this.palette.id}  FACING: ${facing > 0 ? "+" : "-"}`, x, y - 6);
        ctx.restore();
    }
}
function clampLayout(src, frames, columns, rows, kind) {
    const cells = Math.max(1, columns * rows);
    let n = Math.max(1, frames);
    if (n > cells) {
        if (!layoutWarned.has(src)) {
            layoutWarned.add(src);
            console.warn(`[sprites] ${kind} ${src} frames=${n} layout=${columns}x${rows}; clamping to ${cells}`);
        }
        n = cells;
    }
    return { frames: n, columns, rows };
}
export function clearTintCache() {
    tintCache.clear();
}
function tintWithMask(skin, src, maskSrc, pal, img, mask) {
    const key = `${skin}:${src}:${maskSrc}:${pal.id}`;
    const hit = tintCache.get(key);
    if (hit)
        return hit;
    const w = imageWidth(img);
    const h = imageHeight(img);
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const g = out.getContext("2d");
    if (!g || !w || !h)
        return out;
    g.drawImage(img, 0, 0);
    const overlay = document.createElement("canvas");
    overlay.width = w;
    overlay.height = h;
    const og = overlay.getContext("2d");
    if (!og) {
        tintCache.set(key, out);
        return out;
    }
    og.filter = paletteFilter(pal);
    og.drawImage(img, 0, 0);
    og.filter = "none";
    og.globalCompositeOperation = "destination-in";
    og.drawImage(mask, 0, 0);
    g.drawImage(overlay, 0, 0);
    tintCache.set(key, out);
    return out;
}
function pickFrame(clip, n, time, fps, opts) {
    const atk = opts.attack;
    if (atk && opts.attackFrame != null && isAttackClip(clip.name)) {
        if (clip.frameMap && clip.frameMap.length) {
            const total = Math.max(1, atk.startup + atk.active + atk.recovery);
            const idx = Math.min(clip.frameMap.length - 1, Math.floor((opts.attackFrame / total) * clip.frameMap.length));
            return ((clip.frameMap[idx] % n) + n) % n;
        }
        return attackMappedFrame(n, opts.attackFrame, atk.startup, atk.active, atk.recovery);
    }
    let i = clip.loop
        ? Math.floor(time * fps) % n
        : Math.min(n - 1, Math.floor(time * fps));
    if (clip.reverseFrames)
        i = n - 1 - i;
    return i;
}
function isAttackClip(name) {
    return [
        "light", "medium", "heavy", "kickLight", "kickHeavy", "aerial", "throw",
        "special1", "special2", "special3", "super", "finish1", "finish2", "counter",
    ].includes(name);
}
function attackMappedFrame(n, attackFrame, startup, active, recovery) {
    const total = Math.max(1, startup + active + recovery);
    const f = Math.max(0, Math.min(total, attackFrame));
    const startN = Math.max(1, Math.round(n * 0.3));
    const activeN = Math.max(1, Math.round(n * 0.4));
    const recN = Math.max(1, n - startN - activeN);
    if (f < startup) {
        const t = startup <= 1 ? 0 : f / (startup - 1);
        return Math.min(startN - 1, Math.floor(t * startN));
    }
    if (f < startup + active) {
        const t = active <= 1 ? 1 : (f - startup) / Math.max(1, active - 1);
        return Math.min(startN + activeN - 1, startN + Math.floor(t * activeN));
    }
    const t = recovery <= 1 ? 1 : (f - startup - active) / Math.max(1, recovery);
    return Math.min(n - 1, startN + activeN + Math.floor(t * recN));
}
function imageWidth(img) {
    if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement)
        return img.naturalWidth || img.width;
    if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap)
        return img.width;
    if ("width" in img)
        return Number(img.width);
    return 0;
}
function imageHeight(img) {
    if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement)
        return img.naturalHeight || img.height;
    if (typeof ImageBitmap !== "undefined" && img instanceof ImageBitmap)
        return img.height;
    if ("height" in img)
        return Number(img.height);
    return 0;
}
