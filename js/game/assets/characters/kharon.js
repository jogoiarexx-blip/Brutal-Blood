import { assetUrl } from "../url.js";
import { clip, clipMap, bindSheets, fighterSheets, bindAvailableClips } from "../clips.js";
import { KHARON_PALETTES } from "../palettes.js";
const r24 = { columns: 4, rows: 2 };
const r23 = { columns: 3, rows: 2 };
const r44 = { columns: 4, rows: 4 };
const r22 = { columns: 2, rows: 2 };
/** Visual frames mapped onto startup/active/recovery. */
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
export const kharonAssets = bindAvailableClips({
    id: "kharon",
    portrait: assetUrl("/fighters/kharon.webp"),
    skin: "default",
    availableClips: [
        "idle", "walk", "dash", "crouch", "block",
        "light", "medium", "heavy", "kickLight", "kickHeavy", "aerial",
        "jumpStart", "jump", "fall",
        "hit", "hitHeavy", "knockdown", "wakeup",
        "throw", "special1", "special2", "special3", "super",
        "victory", "finish1", "finish2", "intro", "taunt", "counter",
    ],
    palettes: KHARON_PALETTES,
    effects: [],
    audio: [],
    clips: bindSheets(clipMap([
        clip("idle", 8, 10, r24),
        clip("walk", 8, 10, r24),
        clip("walkBack", 8, 8, { ...r24, reverseFrames: true }),
        clip("dash", 6, 14, r23),
        clip("jumpStart", 4, 12, r22),
        clip("jump", 6, 8, r23),
        clip("fall", 4, 8, r22),
        clip("crouch", 4, 8, { ...r22, loop: true }),
        clip("block", 4, 10, { ...r22, loop: true }),
        clip("blockLow", 4, 10, r22),
        clip("light", 6, 14, { ...r23, frameMap: phases(6, 2, 2, 2, 4, 3, 8) }),
        clip("medium", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 7, 4, 12) }),
        clip("heavy", 8, 11, { ...r24, frameMap: phases(8, 3, 2, 3, 12, 5, 18) }),
        clip("kickLight", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 5, 3, 10) }),
        clip("kickHeavy", 8, 11, { ...r24, frameMap: phases(8, 3, 2, 3, 14, 5, 20) }),
        clip("aerial", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 6, 8, 8) }),
        clip("throw", 8, 10, { ...r24, frameMap: phases(8, 2, 2, 4, 5, 3, 22) }),
        clip("special1", 8, 12, { ...r24, frameMap: phases(8, 2, 3, 3, 10, 8, 18) }),
        clip("special2", 8, 12, { ...r24, frameMap: phases(8, 2, 3, 3, 7, 10, 22) }),
        clip("special3", 8, 11, { ...r24, frameMap: phases(8, 3, 2, 3, 14, 4, 24) }),
        clip("super", 16, 12, { ...r44, frameMap: phases(16, 4, 7, 5, 8, 16, 28) }),
        clip("hit", 4, 10, r22),
        clip("hitHeavy", 4, 8, r22),
        clip("knockdown", 8, 8, r24),
        clip("wakeup", 6, 8, r23),
        clip("victory", 8, 8, r24),
        clip("finish1", 16, 10, { ...r44, frameMap: phases(16, 4, 6, 6, 10, 16, 24) }),
        clip("finish2", 16, 10, { ...r44, frameMap: phases(16, 4, 6, 6, 10, 16, 24) }),
        clip("intro", 8, 8, r24),
        clip("counter", 6, 12, { ...r23, frameMap: phases(6, 2, 2, 2, 3, 10, 20) }),
        clip("taunt", 6, 6, r23),
    ]), fighterSheets("kharon")),
});
