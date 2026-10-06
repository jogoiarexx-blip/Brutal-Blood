import { kharon } from "../characters/kharon.js";
import { nyx } from "../characters/nyx.js";
import { draven } from "../characters/draven.js";
import { vespera } from "../characters/vespera.js";
import { gorr } from "../characters/gorr.js";
import { shai } from "../characters/shai.js";
import { kharonAssets } from "../assets/characters/kharon.js";
import { nyxAssets } from "../assets/characters/nyx.js";
import { dravenAssets } from "../assets/characters/draven.js";
import { vesperaAssets } from "../assets/characters/vespera.js";
import { gorrAssets } from "../assets/characters/gorr.js";
import { shaiAssets } from "../assets/characters/shai.js";
function fighter(def, assets) {
    if (def.id !== assets.id) {
        throw new Error(`Content registry mismatch: ${def.id} != ${assets.id}`);
    }
    return { id: def.id, def, assets };
}
/**
 * Single source of truth for fighters that are actually playable in this build.
 * Adding a playable fighter here makes it available to gameplay and asset loading.
 * Progression/visibility remains data-driven in progression/rosterSlots.ts.
 */
export const FIGHTER_CONTENT = [
    fighter(kharon, kharonAssets),
    fighter(nyx, nyxAssets),
    fighter(draven, dravenAssets),
    fighter(vespera, vesperaAssets),
    fighter(gorr, gorrAssets),
    fighter(shai, shaiAssets),
];
export const PLAYABLE_FIGHTERS = FIGHTER_CONTENT.map((x) => x.def);
export const PLAYABLE_FIGHTER_IDS = FIGHTER_CONTENT.map((x) => x.id);
const BY_ID = new Map(FIGHTER_CONTENT.map((entry) => [entry.id, entry]));
export function getFighterContent(id) {
    return BY_ID.get(id);
}
export function requireFighterContent(id) {
    const entry = getFighterContent(id);
    if (!entry)
        throw new Error(`Lutador indisponível nesta build: ${id}`);
    return entry;
}
