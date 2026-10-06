import { assetUrl } from "../url.js";
import { clip, clipMap, bindSheets, fighterSheets, bindAvailableClips } from "../clips.js";
import { VESPERA_PALETTES } from "../palettes.js";
const r24 = { columns: 4, rows: 2 };
const r23 = { columns: 3, rows: 2 };
const r44 = { columns: 4, rows: 4 };
const r22 = { columns: 2, rows: 2 };
/** Maps visual frames onto startup/active/recovery so the pose follows combat timing. */
function phases(n, startN, actN, recN, startup, active, recovery) {
    const out = [];
    const sN = Math.max(1, startN);
    const aN = Math.max(1, actN);
    const rN = Math.max(1, recN);
    for (let f = 0; f < startup + active + recovery; f++) {
        if (f < startup) {
            const t = startup <= 1 ? 0 : f / (startup - 1);
            out.push(Math.min(sN - 1, Math.floor(t * sN)));
        }
        else if (f < startup + active) {
            const t = active <= 1 ? 0 : (f - startup) / Math.max(1, active - 1);
            out.push(Math.min(sN + aN - 1, sN + Math.floor(t * aN)));
        }
        else {
            const t = recovery <= 1 ? 1 : (f - startup - active) / Math.max(1, recovery);
            out.push(Math.min(n - 1, sN + aN + Math.floor(t * rN)));
        }
    }
    return out;
}
/**
 * Vespera v0.9.4 visual pass.
 * All listed clips are real WebP files with alpha. Some secondary actions deliberately
 * reuse same-design Vespera art until their unique animation pass, preventing any swap
 * back to the legacy black-robed model during gameplay.
 */
export const vesperaAssets = bindAvailableClips({
    id: "vespera",
    portrait: assetUrl("/fighters/vespera.webp"),
    skin: "default",
    availableClips: [
        "idle", "walk", "walkBack", "dash", "jumpStart", "jump", "fall",
        "crouch", "block", "blockLow",
        "light", "medium", "heavy", "kickLight", "kickHeavy", "aerial", "throw",
        "special1", "special2", "special3", "super",
        "hit", "hitHeavy", "knockdown", "wakeup", "victory",
        "finish1", "finish2", "intro", "counter", "taunt",
    ],
    palettes: VESPERA_PALETTES,
    effects: [],
    audio: [],
    clips: bindSheets(clipMap([
        clip("idle", 8, 8, r24),
        clip("walk", 8, 9, r24),
        clip("walkBack", 8, 8, { ...r24, reverseFrames: false }),
        clip("dash", 6, 12, r23),
        clip("jumpStart", 4, 10, r22),
        clip("jump", 6, 8, r23),
        clip("fall", 4, 8, r22),
        clip("crouch", 4, 8, { ...r22, loop: true }),
        clip("block", 4, 10, { ...r22, loop: true }),
        clip("blockLow", 4, 10, { ...r22, loop: true }),
        clip("light", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 6, 3, 10) }),
        clip("medium", 6, 11, { ...r23, frameMap: phases(6, 2, 2, 2, 9, 5, 13) }),
        clip("heavy", 8, 10, { ...r24, frameMap: phases(8, 3, 2, 3, 14, 6, 20) }),
        clip("kickLight", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 7, 4, 12) }),
        clip("kickHeavy", 8, 10, { ...r24, frameMap: phases(8, 3, 2, 3, 15, 5, 22) }),
        clip("aerial", 6, 11, { ...r23, frameMap: phases(6, 2, 2, 2, 7, 8, 10) }),
        clip("throw", 8, 10, { ...r24, frameMap: phases(8, 2, 2, 4, 5, 3, 22) }),
        clip("special1", 8, 11, { ...r24, frameMap: phases(8, 3, 2, 3, 16, 4, 26) }),
        clip("special2", 8, 10, { ...r24, frameMap: phases(8, 3, 2, 3, 18, 6, 28) }),
        clip("special3", 8, 11, { ...r24, frameMap: phases(8, 3, 2, 3, 12, 8, 22) }),
        clip("super", 16, 11, { ...r44, frameMap: phases(16, 4, 7, 5, 10, 18, 30) }),
        clip("hit", 4, 10, r22),
        clip("hitHeavy", 4, 8, r22),
        clip("knockdown", 8, 8, r24),
        clip("wakeup", 6, 8, r23),
        clip("victory", 6, 8, r23),
        clip("finish1", 16, 10, r44),
        clip("finish2", 16, 10, r44),
        clip("intro", 8, 8, r24),
        clip("counter", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 3, 10, 18) }),
        clip("taunt", 6, 6, r23),
    ]), fighterSheets("vespera")),
});
