export const DEFAULT_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 200, saturate: 0.9, brightness: 1.08 },
];
/** Base palettes only. Extra colors come from the rewards catalog when granted. */
export const KHARON_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 205, saturate: 0.82, brightness: 1.12 },
];
export const NYX_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 150, saturate: 0.95, brightness: 1.06 },
];
export const DRAVEN_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 95, saturate: 0.85, brightness: 1.1 },
];
export const VESPERA_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 42, saturate: 1.05, brightness: 1.12 },
];
export const GORR_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 165, saturate: 0.82, brightness: 1.08 },
];
export const SHAI_PALETTES = [
    { id: "default", hue: 0, saturate: 1, brightness: 1 },
    { id: "alternate", hue: 225, saturate: 0.9, brightness: 1.1 },
];
export function paletteAt(list, index) {
    const l = list && list.length ? list : DEFAULT_PALETTES;
    const i = ((index % l.length) + l.length) % l.length;
    return l[i];
}
export function isIdentityPalette(p) {
    return p.hue === 0 && p.saturate === 1 && p.brightness === 1;
}
export function paletteFilter(p) {
    if (isIdentityPalette(p))
        return "none";
    return `hue-rotate(${p.hue}deg) saturate(${p.saturate}) brightness(${p.brightness})`;
}
