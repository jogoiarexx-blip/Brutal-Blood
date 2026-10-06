const arcade = (id, name) => ({
    kind: "arcadeClearWith",
    target: id,
    description: `Zere o Arcade com ${name}`,
});
/** Generic rewards. Fighters stay in rosterSlots — this catalog is palettes, titles, gallery, music, endings, skins, stages. */
export const REWARDS = [
    { id: "palette-kharon-blood", kind: "palette", name: "Sangue Seco", subtitle: "Paleta Kharon", fighterId: "kharon", color: "#8a1a1a", palette: { id: "blood", hue: 330, saturate: 1.2, brightness: 0.95 }, description: "Uma paleta carmesim para o Carrasco.", unlock: arcade("kharon", "Kharon") },
    { id: "palette-nyx-eclipse", kind: "palette", name: "Eclipse", subtitle: "Paleta Nyx", fighterId: "nyx", color: "#2a4a6a", palette: { id: "eclipse", hue: 195, saturate: 1.1, brightness: 1.05 }, description: "O vazio esfria para azul-petróleo.", unlock: arcade("nyx", "Nyx") },
    { id: "palette-draven-gold", kind: "palette", name: "Ferrugem Dourada", subtitle: "Paleta Draven", fighterId: "draven", color: "#c09030", palette: { id: "gold", hue: 40, saturate: 1.15, brightness: 1.08 }, description: "Os punhos brilham como relíquia.", unlock: arcade("draven", "Draven") },
    { id: "palette-vespera-ivory", kind: "palette", name: "Marfim", subtitle: "Paleta Vespera", fighterId: "vespera", color: "#d8c8b0", palette: { id: "ivory", hue: 25, saturate: 0.55, brightness: 1.2 }, description: "A viúva veste branco funerário.", unlock: arcade("vespera", "Vespera") },
    { id: "title-carrasco", kind: "title", name: "Carrasco", subtitle: "Título", color: "#c9202b", description: "Conclua o Arcade uma vez.", unlock: { kind: "arcadeClearCount", value: 1, description: "1 Arcade" } },
    { id: "title-invicto", kind: "title", name: "Invicto", subtitle: "Título", color: "#d4a04a", description: "Zere o Arcade sem Continue.", unlock: { kind: "arcadeNoContinue", description: "Arcade sem Continue" } },
    { id: "title-sanguinario", kind: "title", name: "Sanguinário", subtitle: "Título", color: "#e04040", description: "10 Blood Finishes.", unlock: { kind: "bloodFinishes", value: 10, description: "10 Blood Finishes" } },
    { id: "title-algoz", kind: "title", name: "Algoz", subtitle: "Título", color: "#801818", description: "20 Blood Finishes.", unlock: { kind: "bloodFinishes", value: 20, description: "20 Blood Finishes" } },
    { id: "title-lenda", kind: "title", name: "Lenda da Arena", subtitle: "Título", color: "#c8a070", description: "4 Arcades com lutadores diferentes.", unlock: { kind: "arcadeClearCount", value: 4, description: "4 Arcades" } },
    { id: "title-pesadelo", kind: "title", name: "Pesadelo", subtitle: "Título", color: "#6040a0", description: "Zere em Difícil ou superior.", unlock: { kind: "arcadeDifficulty", minDifficulty: "hard", description: "Arcade Difícil+" } },
    { id: "title-carcereiro", kind: "title", name: "Carcereiro", subtitle: "Título", color: "#a07040", description: "Derrote o desafiante secreto.", hiddenDescription: "Uma presença observa.", unlock: { kind: "secretFightWin", target: "warden-duel", description: "Derrotar o Carcereiro" } },
    { id: "ending-kharon", kind: "ending", name: "Sentença Cumprida", subtitle: "Final Kharon", fighterId: "kharon", color: "#8a1a1a", description: "O final do Carrasco.", unlock: arcade("kharon", "Kharon") },
    { id: "ending-nyx", kind: "ending", name: "Silêncio do Vazio", subtitle: "Final Nyx", fighterId: "nyx", color: "#7a4aff", description: "O final da Lâmina.", unlock: arcade("nyx", "Nyx") },
    { id: "ending-draven", kind: "ending", name: "Último Round", subtitle: "Final Draven", fighterId: "draven", color: "#d4a04a", description: "O final dos Punhos de Ferro.", unlock: arcade("draven", "Draven") },
    { id: "ending-vespera", kind: "ending", name: "Véu Rasgado", subtitle: "Final Vespera", fighterId: "vespera", color: "#e04070", description: "O final da Viúva.", unlock: arcade("vespera", "Vespera") },
    { id: "gallery-kharon-art", kind: "gallery", name: "Retrato do Carrasco", subtitle: "Galeria", fighterId: "kharon", color: "#8a1a1a", description: "Arte de Kharon na galeria.", unlock: arcade("kharon", "Kharon") },
    { id: "gallery-roster", kind: "gallery", name: "Elenco Sombrio", subtitle: "Galeria", color: "#401014", description: "Arte do roster após 8 lutadores.", unlock: { kind: "arcadeClearCount", value: 3, description: "3 Arcades" } },
    { id: "music-fortress", kind: "music", name: "Hino da Fortaleza", subtitle: "Música", color: "#501010", description: "Tema da Fortaleza Final.", unlock: { kind: "arcadeClearCount", value: 1, description: "1 Arcade" } },
    { id: "music-void", kind: "music", name: "O Vazio Observa", subtitle: "Música", color: "#241838", hiddenDescription: "Uma presença observa.", description: "Tema da Presença.", unlock: { kind: "secretFightWin", target: "nihl-duel", description: "Derrotar Nihl" } },
    { id: "skin-kharon-executioner", kind: "skin", name: "Traje do Algoz", subtitle: "Skin Kharon", fighterId: "kharon", color: "#4a1010", comingSoon: true, description: "Skin alternativa do Kharon.", unlock: { kind: "compound", description: "Kharon no Brutal", allOf: [arcade("kharon", "Kharon"), { kind: "arcadeDifficulty", minDifficulty: "brutal", description: "Brutal" }] } },
    { id: "stage-blood-moon", kind: "stage", name: "Lua de Sangue", subtitle: "Arena", color: "#801818", comingSoon: true, description: "Uma arena sob o eclipse carmesim.", unlock: { kind: "bloodFinishes", value: 15, description: "15 Blood Finishes" } },
];
export const REWARD_KIND_LABELS = {
    fighter: "Lutador",
    palette: "Paleta",
    skin: "Skin",
    stage: "Arena",
    music: "Música",
    gallery: "Galeria",
    ending: "Final",
    title: "Título",
};
export function rewardById(id) {
    return REWARDS.find((r) => r.id === id);
}
