import { playable } from "../characters/roster.js";
import { STAGES } from "../graphics/stages.js";
export const ARCADE_LADDER = [
    { label: "RUA 1", difficulty: "easy", stageId: "abandoned", mirror: false },
    { label: "RUA 2", difficulty: "normal", stageId: "temple", mirror: false },
    { label: "RUA 3", difficulty: "hard", stageId: "industrial", mirror: true },
    { label: "RUA 4", difficulty: "brutal", stageId: "cathedral", mirror: false },
    { label: "CHEFE", difficulty: "nightmare", stageId: "fortress", mirror: false },
];
export const ARCADE_CONTINUES = 1;
export const SURVIVAL_HEAL = 0.18;
export function otherFighter(id) {
    return playable.find((p) => p.id !== id) ?? playable[0];
}
export function othersOf(id) {
    const list = playable.filter((p) => p.id !== id);
    return list.length ? list : [...playable];
}
export function arcadeOpponent(p1, fight, index = 0) {
    if (fight.mirror)
        return p1;
    const others = othersOf(p1.id);
    return others[index % others.length];
}
export function survivalOpponent(p1, wave) {
    const cycle = [...othersOf(p1.id), p1];
    return cycle[(wave - 1) % cycle.length];
}
export function buildBracket(p1) {
    const others = othersOf(p1.id);
    const pool = [];
    for (let i = 0; i < 3; i++)
        pool.push(others[i % others.length]);
    const [semiOpp, otherA, otherB] = pool;
    const score = (c) => c.ratings.power + c.ratings.defense + c.ratings.speed;
    const finalOpp = score(otherA) >= score(otherB) ? otherA : otherB;
    return { semiOpp, otherA, otherB, finalOpp };
}
export function survivalDifficulty(wave) {
    if (wave <= 2)
        return "easy";
    if (wave <= 4)
        return "normal";
    if (wave <= 6)
        return "hard";
    if (wave <= 8)
        return "brutal";
    return "nightmare";
}
export function survivalStage(wave) {
    return STAGES[(wave - 1) % STAGES.length]?.id ?? "abandoned";
}
export function healCarry(health, max) {
    return Math.min(max, Math.max(1, health + max * SURVIVAL_HEAL));
}
