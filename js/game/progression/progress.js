import { higherDifficulty } from "../core/config.js";
import { getSave, patchSave, emptyCharacterProgress } from "../core/save.js";
import { INITIAL_IDS, PLAYABLE_INITIAL_IDS, ROSTER_SLOTS, slotById } from "./rosterSlots.js";
import { isUnlocked, isRevealed, pendingSecretFights, reqMet } from "./evaluate.js";
import { flushRewards, debugGrantAllRewards } from "./rewards.js";
import { REWARDS } from "./rewardsCatalog.js";
function saveNow() {
    return getSave();
}
function ensureProgress(save, id) {
    const cur = save.characterProgress[id] ?? emptyCharacterProgress();
    return cur;
}
export function recordArcadeClear(fighterId, opts) {
    const save = saveNow();
    const prog = { ...ensureProgress(save, fighterId) };
    prog.arcadeCleared = true;
    prog.clears += 1;
    prog.highestDifficulty = higherDifficulty(prog.highestDifficulty, opts.difficulty);
    const arcadeClears = Array.from(new Set([...(save.arcadeClears ?? []), fighterId]));
    const noContinueClears = opts.noContinue
        ? Array.from(new Set([...(save.noContinueClears ?? []), fighterId]))
        : (save.noContinueClears ?? []);
    patchSave({
        arcadeCleared: true,
        arcadeClears,
        noContinueClears,
        highestDifficultyClear: higherDifficulty(save.highestDifficultyClear, opts.difficulty),
        characterProgress: { ...save.characterProgress, [fighterId]: prog },
    });
    return flushUnlocks();
}
export function recordStoryClear(fighterId) {
    const save = saveNow();
    const prog = { ...ensureProgress(save, fighterId), storyCleared: true };
    const storyCleared = Array.from(new Set([...(save.storyCleared ?? []), fighterId]));
    patchSave({
        storyCleared,
        characterProgress: { ...save.characterProgress, [fighterId]: prog },
    });
    return flushUnlocks();
}
export function recordBloodFinish(fighterId) {
    const save = saveNow();
    const prog = { ...ensureProgress(save, fighterId) };
    prog.bloodFinishes += 1;
    patchSave({
        bloodFinishCount: (save.bloodFinishCount ?? 0) + 1,
        characterProgress: { ...save.characterProgress, [fighterId]: prog },
    });
    return flushUnlocks();
}
export function recordPerfect(fighterId) {
    const save = saveNow();
    const prog = { ...ensureProgress(save, fighterId) };
    prog.perfects += 1;
    patchSave({
        perfectWins: (save.perfectWins ?? 0) + 1,
        characterProgress: { ...save.characterProgress, [fighterId]: prog },
    });
}
export function recordSecretFight(fightId, won) {
    const save = saveNow();
    if (won) {
        patchSave({ secretFightsWon: Array.from(new Set([...(save.secretFightsWon ?? []), fightId])) });
    }
    else {
        patchSave({ secretFightsLost: Array.from(new Set([...(save.secretFightsLost ?? []), fightId])) });
    }
    return flushUnlocks();
}
export function flushUnlocks() {
    const save = saveNow();
    const unlocked = new Set(save.unlockedCharacters ?? save.unlocked ?? []);
    const revealed = new Set(save.revealedCharacters ?? []);
    const pending = [...(save.pendingUnlocks ?? [])];
    const newUnlocks = [];
    const newReveals = [];
    for (const slot of ROSTER_SLOTS) {
        if (slot.visibility === "hidden" && slot.reveal && !revealed.has(slot.id) && reqMet(slot.reveal, { ...save, unlockedCharacters: [...unlocked] })) {
            revealed.add(slot.id);
            newReveals.push(slot.id);
        }
        if (unlocked.has(slot.id))
            continue;
        if (slot.initiallyUnlocked) {
            unlocked.add(slot.id);
            continue;
        }
        if (slot.unlock && reqMet(slot.unlock, { ...getSave(), unlockedCharacters: [...unlocked], revealedCharacters: [...revealed] })) {
            unlocked.add(slot.id);
            if (!(save.seenUnlockCinematics ?? []).includes(slot.id) && !pending.includes(slot.id)) {
                pending.push(slot.id);
                newUnlocks.push(slot.id);
            }
        }
    }
    const merged = Array.from(unlocked);
    patchSave({
        unlocked: merged,
        unlockedCharacters: merged,
        revealedCharacters: Array.from(revealed),
        pendingUnlocks: pending,
    });
    const rewards = flushRewards();
    const secret = pendingSecretFights(getSave())[0] ?? null;
    return { unlocks: newUnlocks, rewards, reveals: newReveals, secretFight: secret };
}
export function consumeUnlockCinematic(id) {
    const save = saveNow();
    patchSave({
        pendingUnlocks: (save.pendingUnlocks ?? []).filter((x) => x !== id),
        seenUnlockCinematics: Array.from(new Set([...(save.seenUnlockCinematics ?? []), id])),
    });
}
export function nextPendingUnlock() {
    return getSave().pendingUnlocks?.[0] ?? null;
}
export function progressSnapshot() {
    const save = getSave();
    const unlocked = (save.unlockedCharacters ?? save.unlocked ?? []).length;
    const total = ROSTER_SLOTS.length;
    const arcadeClears = (save.arcadeClears ?? []).length;
    const blood = save.bloodFinishCount ?? 0;
    const secrets = (save.secretFightsWon ?? []).length;
    const rewardsGranted = (save.grantedRewards ?? []).length;
    const rewardTotal = REWARDS.length;
    const fighterShare = unlocked / total;
    const arcadeShare = Math.min(1, arcadeClears / Math.max(1, PLAYABLE_INITIAL_IDS.length));
    const bloodShare = Math.min(1, blood / 20);
    const secretShare = Math.min(1, secrets / 2);
    const rewardShare = rewardTotal ? rewardsGranted / rewardTotal : 0;
    return {
        unlocked,
        total,
        arcadeClears,
        bloodFinishes: blood,
        secretWins: secrets,
        highestDifficulty: save.highestDifficultyClear,
        rewards: rewardsGranted,
        rewardTotal,
        percent: Math.min(100, Math.round(fighterShare * 50 + arcadeShare * 12 + bloodShare * 8 + secretShare * 5 + rewardShare * 25)),
    };
}
export function debugUnlockAll() {
    const ids = ROSTER_SLOTS.map((s) => s.id);
    patchSave({
        unlocked: ids,
        unlockedCharacters: ids,
        revealedCharacters: ids,
        pendingUnlocks: [],
        seenUnlockCinematics: ids,
    });
    debugGrantAllRewards();
}
export function debugLockAll() {
    patchSave({
        unlocked: [...INITIAL_IDS],
        unlockedCharacters: [...INITIAL_IDS],
        revealedCharacters: [],
        arcadeClears: [],
        noContinueClears: [],
        highestDifficultyClear: null,
        bloodFinishCount: 0,
        secretFightsWon: [],
        secretFightsLost: [],
        perfectWins: 0,
        pendingUnlocks: [],
        seenUnlockCinematics: [],
        arcadeCleared: false,
        characterProgress: {},
        grantedRewards: [],
        pendingRewards: [],
        seenRewardCinematics: [],
        equippedTitle: null,
        equippedPalettes: {},
    });
}
export function debugSimulateArcade(id, difficulty = "normal", noContinue = false) {
    return recordArcadeClear(id, { difficulty, noContinue });
}
export { isUnlocked, isRevealed, slotById };
