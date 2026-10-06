const r = (power, speed, defense, range) => ({ power, speed, defense, range });
const arcadeWith = (id, name) => ({
    kind: "arcadeClearWith",
    target: id,
    description: `Zere o Arcade com ${name}`,
});
const wardenFight = {
    id: "warden-duel",
    unlockId: "warden",
    standInId: "kharon",
    displayName: "WARDEN",
    displayTitle: "O Carcereiro",
    intro: "UM NOVO DESAFIANTE SE APROXIMA",
    winLine: "As grades se abrem. O Carcereiro reconhece o sangue.",
    loseLine: "A sentença adia. O Carcereiro espera outra noite.",
    difficulty: "brutal",
    stageId: "fortress",
    trigger: {
        kind: "compound",
        description: "Provar valor no Arcade com sangue derramado.",
        hiddenDescription: "Uma presença observa lutadores dignos.",
        allOf: [
            { kind: "arcadeClearCount", value: 2, description: "2 Arcades" },
            { kind: "bloodFinishes", value: 3, description: "3 Blood Finishes" },
        ],
    },
};
const nihlFight = {
    id: "nihl-duel",
    unlockId: "nihl",
    standInId: "nyx",
    displayName: "NIHL",
    displayTitle: "A Presença",
    intro: "A PRESENÇA QUE OBSERVAVA FINALMENTE DESPERTA.",
    winLine: "O vazio recua. O nome é seu.",
    loseLine: "A presença se fecha. Ainda não.",
    difficulty: "nightmare",
    stageId: "fortress",
    trigger: {
        kind: "compound",
        description: "O elenco quase completo e um desafiante caído.",
        hiddenDescription: "Uma presença observa lutadores dignos.",
        allOf: [
            { kind: "arcadeClearCount", value: 4, description: "4 Arcades" },
            { kind: "secretFightWin", target: "warden-duel", description: "Derrotar o Carcereiro" },
            { kind: "bloodFinishes", value: 10, description: "10 Blood Finishes" },
        ],
    },
};
/** 20 roster slots. Only ids with CharacterDef + playable=true can enter a fight. */
export const ROSTER_SLOTS = [
    { slot: 1, id: "kharon", name: "KHARON", title: "O Carrasco", style: "Rushdown", color: "#8a1a1a", accent: "#c9202b", ratings: r(8, 5, 7, 6), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 2, id: "nyx", name: "NYX", title: "A Lâmina do Vazio", style: "Mixup", color: "#2a1a4a", accent: "#7a4aff", ratings: r(6, 8, 4, 5), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 3, id: "draven", name: "DRAVEN", title: "Punhos de Ferro", style: "Boxer", color: "#3a2a18", accent: "#d4a04a", ratings: r(9, 4, 8, 3), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 4, id: "vespera", name: "VESPERA", title: "A Viúva Carmesim", style: "Zoner", color: "#4a1020", accent: "#e04070", ratings: r(5, 6, 5, 9), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 5, id: "gorr", name: "GORR", title: "O Devorador", style: "Grappler", color: "#4a3a32", accent: "#c45a32", ratings: r(10, 3, 9, 2), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 6, id: "shai", name: "SHAI", title: "Olho Carmesim", style: "Zoner", color: "#5a1a1a", accent: "#ff5a5a", ratings: r(6, 8, 4, 10), initiallyUnlocked: true, playable: true, visibility: "locked_visible" },
    { slot: 7, id: "kael", name: "KAEL", title: "O Jurado", style: "Balanced", color: "#3a2a2a", accent: "#b08060", ratings: r(7, 6, 6, 6), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("kharon", "Kharon") },
    { slot: 8, id: "lyss", name: "LYSS", title: "A Sombra Gélida", style: "Mixup", color: "#1a2a3a", accent: "#6ab0d4", ratings: r(5, 9, 3, 6), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("nyx", "Nyx") },
    { slot: 9, id: "thorn", name: "THORN", title: "O Cravo", style: "Charge", color: "#2a3a22", accent: "#88aa44", ratings: r(8, 5, 7, 5), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("draven", "Draven") },
    { slot: 10, id: "iva", name: "IVA", title: "A Voz do Sino", style: "Trap", color: "#3a2040", accent: "#c090e0", ratings: r(4, 7, 5, 8), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("vespera", "Vespera") },
    { slot: 11, id: "dusk", name: "DUSK", title: "O Crepúsculo", style: "Rushdown", color: "#2a2030", accent: "#8060a0", ratings: r(7, 7, 5, 5), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("gorr", "Gorr") },
    { slot: 12, id: "nara", name: "NARA", title: "A Caçadora", style: "Zoner", color: "#203028", accent: "#50c090", ratings: r(6, 8, 4, 8), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: arcadeWith("shai", "Shai") },
    { slot: 13, id: "orin", name: "ORIN", title: "O Peregrino", style: "Balanced", color: "#403830", accent: "#c8a070", ratings: r(6, 6, 7, 6), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: { kind: "arcadeClearCount", value: 3, description: "Zere o Arcade com 3 personagens diferentes" } },
    { slot: 14, id: "vark", name: "VARK", title: "O Colosso", style: "Grappler", color: "#3a2818", accent: "#d07030", ratings: r(10, 3, 9, 3), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: { kind: "arcadeClearAllInitials", description: "Zere o Arcade com todos os iniciais jogáveis" } },
    { slot: 15, id: "hex", name: "HEX", title: "Sem Perdão", style: "Rushdown", color: "#301818", accent: "#e04040", ratings: r(8, 7, 4, 5), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: { kind: "arcadeNoContinue", description: "Zere o Arcade sem usar Continue" } },
    { slot: 16, id: "solen", name: "SOLEN", title: "A Lâmina Solar", style: "Charge", color: "#403010", accent: "#e8b040", ratings: r(7, 6, 6, 7), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "locked_visible", unlock: { kind: "arcadeDifficulty", minDifficulty: "hard", description: "Zere o Arcade em Difícil ou superior" } },
    { slot: 17, id: "sable", name: "SABLE", title: "A Coletora", style: "Mixup", color: "#201018", accent: "#c02040", ratings: r(6, 8, 4, 6), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "secret", unlock: { kind: "bloodFinishes", value: 20, description: "Execute 20 Blood Finishes", hiddenDescription: "O sangue abre o caminho." } },
    { slot: 18, id: "warden", name: "WARDEN", title: "O Carcereiro", style: "Grappler", color: "#2a2420", accent: "#a07040", ratings: r(9, 4, 9, 4), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "secret", secretFight: wardenFight, unlock: { kind: "secretFightWin", target: "warden-duel", description: "Derrote o Desafiante Secreto", hiddenDescription: "Uma presença observa lutadores dignos." } },
    { slot: 19, id: "ashen", name: "ASHEN", title: "A Rainha Cinza", style: "Trap", color: "#3a3a40", accent: "#c0c0d0", ratings: r(7, 6, 7, 7), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "secret", unlock: { kind: "compound", description: "Progressão avançada", hiddenDescription: "O trono cinza espera um elenco quase completo.", allOf: [
                { kind: "arcadeClearAllInitials", description: "Iniciais jogáveis" },
                { kind: "arcadeClearCount", value: 4, description: "4 Arcades" },
                { kind: "arcadeDifficulty", minDifficulty: "brutal", description: "Arcade em Brutal" },
                { kind: "bloodFinishes", value: 12, description: "12 Blood Finishes" },
                { kind: "secretFightWin", target: "warden-duel", description: "Desafiante derrotado" },
            ] } },
    { slot: 20, id: "nihl", name: "NIHL", title: "A Presença", style: "Unknown", color: "#101018", accent: "#6040a0", ratings: r(10, 10, 10, 10), initiallyUnlocked: false, playable: false, comingSoon: true, visibility: "hidden", secretFight: nihlFight, reveal: nihlFight.trigger, unlock: { kind: "secretFightWin", target: "nihl-duel", description: "Derrote A Presença", hiddenDescription: "???" } },
];
export const INITIAL_IDS = ROSTER_SLOTS.filter((s) => s.initiallyUnlocked).map((s) => s.id);
/** Initial fighters that are actually playable in the current build. */
export const PLAYABLE_INITIAL_IDS = ROSTER_SLOTS.filter((s) => s.initiallyUnlocked && s.playable).map((s) => s.id);
export const BLOOD_FINISH_UNLOCK = 20;
export function slotById(id) {
    return ROSTER_SLOTS.find((s) => s.id === id);
}
export function slotByNumber(n) {
    return ROSTER_SLOTS.find((s) => s.slot === n);
}
