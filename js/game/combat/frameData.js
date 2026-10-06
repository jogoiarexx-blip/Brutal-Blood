const SCALE = [1, 0.9, 0.8, 0.72, 0.65, 0.58, 0.52, 0.46, 0.42, 0.38, 0.34];
export const COMBO_LIMIT = 10;
export const COMBO_MIN_SCALE = 0.3;
/** Damage multiplier for the Nth hit in a combo (1-based). */
export function comboScale(hits) {
    if (hits <= 1)
        return 1;
    const i = Math.min(hits - 1, SCALE.length - 1);
    return Math.max(COMBO_MIN_SCALE, SCALE[i]);
}
export function stunScale(hits) {
    return Math.max(0.45, 1 - (Math.max(0, hits - 1) * 0.07));
}
export function gravityScale(airHits) {
    return 1 + airHits * 0.22;
}
export function onHitAdv(m) {
    return m.hitStun - m.recovery;
}
export function onBlockAdv(m) {
    return m.blockStun - m.recovery;
}
export function moveTags(m) {
    const tags = [];
    if (m.height === "high")
        tags.push("HIGH");
    else if (m.height === "low")
        tags.push("LOW");
    else
        tags.push("MID");
    if (m.overhead)
        tags.push("OVERHEAD");
    if (m.launcher)
        tags.push("LAUNCHER");
    if (m.armor || (m.invuln && m.invuln >= 6 && m.type === "special" && !m.antiAir))
        tags.push("ARMOR");
    if (m.projectile)
        tags.push("PROJECTILE");
    if (m.grab && m.type === "special")
        tags.push("COMMAND GRAB");
    else if (m.grab)
        tags.push("THROW");
    if (m.antiAir)
        tags.push("ANTI-AIR");
    if (m.type === "super")
        tags.push("SUPER");
    return tags;
}
export function signed(n) {
    if (n > 0)
        return `+${n}`;
    return String(n);
}
