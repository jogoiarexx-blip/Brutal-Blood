import { PLAYABLE_FIGHTERS, requireFighterContent } from "../content/registry.js";
import { ROSTER_SLOTS } from "../progression/rosterSlots.js";
export const playable = [...PLAYABLE_FIGHTERS];
/** UI roster uses the 20 progression slots; implemented fighters resolve from the content registry. */
export const roster = ROSTER_SLOTS.map((s) => {
    const live = playable.find((p) => p.id === s.id);
    if (live)
        return live;
    return {
        id: s.id,
        name: s.name,
        title: s.title,
        style: s.style,
        color: s.color,
        accent: s.accent,
        locked: true,
        ratings: s.ratings,
    };
});
export function getFighter(id) {
    return requireFighterContent(id).def;
}
export function isPlayable(entry) {
    return !("locked" in entry && entry.locked) && playable.some((p) => p.id === entry.id);
}
export function standInFighter(standInId, name, title, color) {
    const base = getFighter(standInId);
    return { ...base, name, title, color };
}
