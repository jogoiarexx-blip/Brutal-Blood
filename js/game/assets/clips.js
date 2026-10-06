import { assetUrl } from "./url.js";
const NO_LOOP = new Set([
    "jumpStart", "hit", "hitHeavy", "knockdown", "wakeup", "victory",
    "super", "finish1", "finish2", "intro", "throw",
    "special1", "special2", "special3", "counter", "taunt", "dash",
]);
/** Filename per clip under /fighters/<id>/. Dedicated files are optional. */
export const CLIP_FILES = {
    idle: "idle.webp",
    walk: "walk.webp",
    walkBack: "walk-back.webp",
    dash: "dash.webp",
    jumpStart: "jump-start.webp",
    jump: "jump.webp",
    fall: "fall.webp",
    crouch: "crouch.webp",
    block: "block.webp",
    blockLow: "block-low.webp",
    light: "light.webp",
    medium: "medium.webp",
    heavy: "heavy.webp",
    kickLight: "kick-light.webp",
    kickHeavy: "kick-heavy.webp",
    aerial: "aerial.webp",
    throw: "throw.webp",
    special1: "special-1.webp",
    special2: "special-2.webp",
    special3: "special-3.webp",
    super: "super.webp",
    hit: "hit.webp",
    hitHeavy: "hit-heavy.webp",
    knockdown: "knockdown.webp",
    wakeup: "wakeup.webp",
    victory: "victory.webp",
    finish1: "finish-1.webp",
    finish2: "finish-2.webp",
    intro: "intro.webp",
    counter: "counter.webp",
    taunt: "taunt.webp",
};
export const ANIM_NAMES = Object.keys(CLIP_FILES);
export const FALLBACK_OF = {
    walkBack: "walk",
    dash: "walk",
    jumpStart: "jump",
    fall: "jump",
    crouch: "idle",
    block: "idle",
    blockLow: "block",
    intro: "idle",
    victory: "idle",
    hitHeavy: "hit",
    knockdown: "hit",
    wakeup: "knockdown",
    medium: "light",
    heavy: "light",
    kickLight: "light",
    kickHeavy: "heavy",
    aerial: "jump",
    throw: "medium",
    special1: "heavy",
    special2: "kickLight",
    special3: "heavy",
    super: "heavy",
    finish1: "super",
    finish2: "heavy",
    counter: "dash",
    taunt: "crouch",
};
export function clip(name, frames, fps, extra = {}) {
    return {
        name,
        frames,
        fps,
        loop: extra.loop ?? !NO_LOOP.has(name),
        pivotX: extra.pivotX ?? 0.5,
        pivotY: extra.pivotY ?? 1,
        row: extra.row,
        rows: extra.rows,
        columns: extra.columns,
        src: extra.src,
        fallback: extra.fallback ?? FALLBACK_OF[name],
        fallbackSrc: extra.fallbackSrc,
        scale: extra.scale,
        offsetX: extra.offsetX,
        offsetY: extra.offsetY,
        reverseFrames: extra.reverseFrames ?? (name === "walkBack" ? true : undefined),
        frameMap: extra.frameMap,
        sheetFrames: extra.sheetFrames,
        sheetColumns: extra.sheetColumns,
        sheetRows: extra.sheetRows,
        sheetFps: extra.sheetFps,
        maskSrc: extra.maskSrc,
    };
}
export function clipMap(list) {
    return Object.fromEntries(list.map((c) => [c.name, c]));
}
const GROUPS = {
    idle: ["idle", "intro", "taunt", "victory", "block", "blockLow", "crouch"],
    walk: ["walk", "walkBack", "dash"],
    attack: ["light", "medium", "heavy", "kickLight", "kickHeavy", "aerial", "throw", "special1", "special2", "special3", "super", "finish1", "finish2", "counter"],
    hurt: ["hit", "hitHeavy", "knockdown", "wakeup"],
    jump: ["jump", "jumpStart", "fall"],
};
/**
 * Attach group WebP sheets as fallbackSrc.
 * Does not overwrite a dedicated clip.src — that is loaded separately when set.
 */
export function bindSheets(clips, sheets) {
    for (const [group, names] of Object.entries(GROUPS)) {
        const sh = sheets[group];
        if (!sh)
            continue;
        for (const n of names) {
            const c = clips[n];
            if (!c)
                continue;
            c.fallbackSrc = sh.src;
            c.sheetFrames = sh.frames;
            c.sheetColumns = sh.columns;
            c.sheetRows = sh.rows;
            c.sheetFps = sh.fps;
            if (!c.fallback)
                c.fallback = FALLBACK_OF[n];
        }
    }
    return clips;
}
export function fighterSheets(id) {
    const p = assetUrl(`/fighters/${id}`);
    const base = {
        idle: { src: `${p}/idle.webp`, frames: 4, columns: 2, rows: 2, fps: 8 },
        walk: { src: `${p}/walk.webp`, frames: 6, columns: 3, rows: 2, fps: 10 },
        attack: { src: `${p}/attack.webp`, frames: 6, columns: 3, rows: 2, fps: 12 },
        hurt: { src: `${p}/hurt.webp`, frames: 4, columns: 2, rows: 2, fps: 10 },
        jump: { src: `${p}/jump.webp`, frames: 4, columns: 2, rows: 2, fps: 10 },
    };
    const override = SHEET_OVERRIDE[id];
    if (override) {
        for (const [group, extra] of Object.entries(override)) {
            const cur = base[group];
            if (cur)
                Object.assign(cur, extra);
        }
    }
    return base;
}
/** Per-fighter group-sheet layout when dedicated files replace the grouped idle/walk. */
const SHEET_OVERRIDE = {
    kharon: {
        idle: { frames: 8, columns: 4, rows: 2, fps: 10 },
        walk: { frames: 8, columns: 4, rows: 2, fps: 10 },
        jump: { frames: 6, columns: 3, rows: 2, fps: 10 },
    },
    // Vespera v0.9.4: same-design transparent WebPs are also the safety group fallbacks.
    // This prevents any missing dedicated clip from swapping back to the legacy model.
    vespera: {
        idle: { src: assetUrl("/fighters/vespera/idle.webp"), frames: 8, columns: 4, rows: 2, fps: 8 },
        walk: { src: assetUrl("/fighters/vespera/walk.webp"), frames: 8, columns: 4, rows: 2, fps: 9 },
        attack: { src: assetUrl("/fighters/vespera/light.webp"), frames: 6, columns: 3, rows: 2, fps: 12 },
        hurt: { src: assetUrl("/fighters/vespera/hit.webp"), frames: 4, columns: 2, rows: 2, fps: 10 },
        jump: { src: assetUrl("/fighters/vespera/jump.webp"), frames: 6, columns: 3, rows: 2, fps: 8 },
    },
    nyx: {
        idle: { frames: 4, columns: 2, rows: 2, fps: 8 },
        walk: { frames: 6, columns: 3, rows: 2, fps: 10 },
        attack: { src: assetUrl("/fighters/nyx/light.webp"), frames: 4, columns: 2, rows: 2, fps: 14 },
        hurt: { src: assetUrl("/fighters/nyx/hit.webp"), frames: 4, columns: 2, rows: 2, fps: 10 },
        jump: { frames: 4, columns: 2, rows: 2, fps: 10 },
    },
    draven: {
        idle: { frames: 4, columns: 2, rows: 2, fps: 8 },
        walk: { frames: 6, columns: 3, rows: 2, fps: 10 },
        attack: { src: assetUrl("/fighters/draven/light.webp"), frames: 4, columns: 2, rows: 2, fps: 14 },
        hurt: { src: assetUrl("/fighters/draven/hit.webp"), frames: 4, columns: 2, rows: 2, fps: 10 },
        jump: { frames: 4, columns: 2, rows: 2, fps: 10 },
    },
    gorr: {
        idle: { frames: 4, columns: 2, rows: 2, fps: 8 },
        walk: { frames: 6, columns: 3, rows: 2, fps: 9 },
        attack: { src: assetUrl("/fighters/gorr/heavy.webp"), frames: 4, columns: 2, rows: 2, fps: 10 },
        hurt: { src: assetUrl("/fighters/gorr/hit.webp"), frames: 4, columns: 2, rows: 2, fps: 9 },
        jump: { frames: 4, columns: 2, rows: 2, fps: 9 },
    },
    shai: {
        idle: { frames: 4, columns: 2, rows: 2, fps: 10 },
        walk: { frames: 6, columns: 3, rows: 2, fps: 12 },
        attack: { src: assetUrl("/fighters/shai/light.webp"), frames: 4, columns: 2, rows: 2, fps: 14 },
        hurt: { src: assetUrl("/fighters/shai/hit.webp"), frames: 4, columns: 2, rows: 2, fps: 11 },
        jump: { frames: 4, columns: 2, rows: 2, fps: 10 },
    },
};
export function dedicatedPath(id, name) {
    return assetUrl(`/fighters/${id}/${CLIP_FILES[name]}`);
}
/**
 * Dedicated clips that currently exist as separate WebPs.
 * Empty while fighters only ship grouped sheets (idle/walk/attack/hurt/jump).
 * Add a name here AND to the character's availableClips when a real dedicated file lands.
 */
export const SHIPPED_CLIPS = [];
/**
 * Set clip.src only for names in availableClips.
 * Never overwrites explicit src, fallbackSrc, or group sheet layout.
 */
export function bindAvailableClips(manifest) {
    const avail = new Set(manifest.availableClips ?? []);
    for (const c of Object.values(manifest.clips)) {
        if (!avail.has(c.name))
            continue;
        if (c.src)
            continue;
        c.src = dedicatedPath(manifest.id, c.name);
    }
    if (!manifest.skin)
        manifest.skin = "default";
    return manifest;
}
/** Classify how SpriteAnimator will resolve a clip without loading images. */
export function classifyClip(manifest, name) {
    const clip = manifest.clips[name];
    if (!clip)
        return "MISSING";
    if (clip.src)
        return "DEDICATED";
    const seen = new Set([name]);
    let cur = clip.fallback;
    while (cur && !seen.has(cur)) {
        seen.add(cur);
        const next = manifest.clips[cur];
        if (next?.src)
            return "CLIP_FALLBACK";
        cur = next?.fallback;
    }
    if (clip.fallbackSrc)
        return "GROUP_FALLBACK";
    cur = clip.fallback;
    seen.clear();
    seen.add(name);
    while (cur && !seen.has(cur)) {
        seen.add(cur);
        const next = manifest.clips[cur];
        if (next?.fallbackSrc)
            return "GROUP_FALLBACK";
        cur = next?.fallback;
    }
    return "MISSING";
}
export function clipInventory(manifest) {
    const dedicated = [];
    const clipFallback = [];
    const groupFallback = [];
    const missing = [];
    for (const name of ANIM_NAMES) {
        const kind = classifyClip(manifest, name);
        if (kind === "DEDICATED")
            dedicated.push(name);
        else if (kind === "CLIP_FALLBACK")
            clipFallback.push(name);
        else if (kind === "GROUP_FALLBACK")
            groupFallback.push(name);
        else
            missing.push(name);
    }
    return { dedicated, clipFallback, groupFallback, missing };
}
