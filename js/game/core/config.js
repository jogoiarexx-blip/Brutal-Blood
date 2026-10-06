import { GAME_VERSION } from "./version.js";
/** Single global config. Never redeclare DEBUG or these constants in other files. */
export const GAME = {
    VERSION: GAME_VERSION,
    WIDTH: 1280,
    HEIGHT: 720,
    FPS: 60,
    FRAME: 1 / 60,
    MAX_DT: 0.1,
    FLOOR: 620,
    GRAVITY: 2200,
    ROUND_TIME: 99,
    WINS_NEEDED: 2,
    FINISH_WINDOW: 5,
    COMBO_DROP: 0.35,
    INPUT_BUFFER: 0.14,
    WAKEUP_INVULN: 12,
    CLASH_FRAMES: 8,
    TECH_FRAMES: 7,
    SAVE_KEY: "brutal-blood-save",
    SAVE_VERSION: 8,
};
export const DEBUG = {
    enabled: false,
    hitboxes: false,
    frameData: false,
    sprites: false,
};
export const DIFFICULTY_LABELS = {
    veryEasy: "Muito Fácil",
    easy: "Fácil",
    normal: "Normal",
    hard: "Difícil",
    brutal: "Brutal",
    nightmare: "Pesadelo",
};
export const DIFFICULTY_RANK = {
    veryEasy: 0,
    easy: 1,
    normal: 2,
    hard: 3,
    brutal: 4,
    nightmare: 5,
};
export function difficultyAtLeast(current, min) {
    if (!current)
        return false;
    return DIFFICULTY_RANK[current] >= DIFFICULTY_RANK[min];
}
export function higherDifficulty(a, b) {
    if (!a)
        return b;
    return DIFFICULTY_RANK[a] >= DIFFICULTY_RANK[b] ? a : b;
}
export const DEFAULT_GRAPHICS = {
    preset: "high",
    accel: "auto",
    fullscreen: false,
    maxFps: 60,
    vsync: true,
    particles: true,
    effects: true,
    shadows: true,
    screenShake: true,
    hitstop: true,
    bloom: true,
    stageFx: true,
    debugSprites: false,
    reduceFlashes: false,
    highContrast: false,
    simplifiedCommands: true,
};
export const QUALITY_PRESETS = {
    low: {
        preset: "low",
        particles: false,
        effects: false,
        shadows: false,
        screenShake: false,
        bloom: false,
        stageFx: false,
        maxFps: 30,
    },
    medium: {
        preset: "medium",
        particles: true,
        effects: true,
        shadows: false,
        screenShake: true,
        bloom: false,
        stageFx: true,
        maxFps: 60,
    },
    high: {
        preset: "high",
        particles: true,
        effects: true,
        shadows: true,
        screenShake: true,
        bloom: true,
        stageFx: true,
        maxFps: 60,
    },
    ultra: {
        preset: "ultra",
        particles: true,
        effects: true,
        shadows: true,
        screenShake: true,
        bloom: true,
        stageFx: true,
        maxFps: 120,
    },
};
export const DEFAULT_AUDIO = {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    voice: 0.7,
    ambient: 0.4,
    ui: 0.6,
    muted: false,
};
export const ACTION_LABELS = {
    left: "Esquerda",
    right: "Direita",
    up: "Pular",
    down: "Agachar",
    light: "Soco leve",
    medium: "Soco médio",
    heavy: "Soco pesado",
    kickLight: "Chute leve",
    kickHeavy: "Chute pesado",
    special: "Especial",
    super: "Super",
    block: "Defesa",
    throw: "Agarrão",
    taunt: "Provocação",
    pause: "Pausa",
};
export const DEFAULT_BINDINGS = {
    p1: {
        left: ["KeyA"],
        right: ["KeyD"],
        up: ["KeyW"],
        down: ["KeyS"],
        light: ["KeyJ"],
        medium: ["KeyU"],
        heavy: ["KeyK"],
        kickLight: ["KeyN"],
        kickHeavy: ["KeyM"],
        special: ["KeyL"],
        super: ["KeyO"],
        block: ["KeyI"],
        throw: ["Space"],
        taunt: ["KeyP"],
        pause: ["Escape"],
    },
    p2: {
        left: ["ArrowLeft"],
        right: ["ArrowRight"],
        up: ["ArrowUp"],
        down: ["ArrowDown"],
        light: ["Digit1", "Numpad1"],
        medium: ["Digit4", "Numpad4"],
        heavy: ["Digit2", "Numpad2"],
        kickLight: ["Digit5", "Numpad5"],
        kickHeavy: ["Digit6", "Numpad6"],
        special: ["Digit3", "Numpad3"],
        super: ["Digit9", "Numpad9"],
        block: ["Digit0", "Numpad0"],
        throw: ["Digit7", "Numpad7"],
        taunt: ["Digit8", "Numpad8"],
        pause: [],
    },
};
export const GAMEPAD_DEFAULT = {
    left: { buttons: [14], axes: "lx-" },
    right: { buttons: [15], axes: "lx+" },
    up: { buttons: [12], axes: "ly-" },
    down: { buttons: [13], axes: "ly+" },
    light: { buttons: [2] },
    medium: { buttons: [3] },
    heavy: { buttons: [1] },
    kickLight: { buttons: [0] },
    kickHeavy: { buttons: [5] },
    special: { buttons: [4] },
    super: { buttons: [7] },
    block: { buttons: [6] },
    throw: { buttons: [10] },
    taunt: { buttons: [11] },
    pause: { buttons: [9] },
};
