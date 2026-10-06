import { playable } from "../characters/roster.js";
import { otherFighter } from "./runs.js";
const kharonStory = {
    fighterId: "kharon",
    title: "A LISTA",
    blurb: "Cada nome riscado. Cada dívida cobrada. A foice não aceita deserção.",
    ending: "A lista está em branco. O carrasco não descansa — só vira a página.",
    beats: [
        {
            chapter: "I",
            title: "Nome riscado",
            intro: "Nyx saiu da lista. A foice não aceita deserção. A arena abandonada ainda cheira a sentença.",
            winLine: "A lâmina caiu. O nome volta para o papel.",
            opponentId: "nyx",
            stageId: "abandoned",
            difficulty: "easy",
        },
        {
            chapter: "II",
            title: "Ferro no fosso",
            intro: "Draven cobra o sino. Kharon cobra o saldo. No distrito, só um dos dois sai de pé.",
            winLine: "O ferro quebrou. O sino calou.",
            opponentId: "draven",
            stageId: "industrial",
            difficulty: "hard",
        },
        {
            chapter: "III",
            title: "Nave sem lua",
            intro: "A catedral engoliu a luz. Nyx espera no altar — desta vez ela não vai sair da lista.",
            winLine: "O eclipse acaba na foice.",
            opponentId: "nyx",
            stageId: "cathedral",
            difficulty: "brutal",
        },
        {
            chapter: "IV",
            title: "Último nome",
            intro: "A Fortaleza Final. Só resta um nome — e ele usa ferro nos punhos.",
            winLine: "O último nome cai. A fortaleza reconhece o carrasco.",
            opponentId: "draven",
            stageId: "fortress",
            difficulty: "nightmare",
        },
    ],
};
const nyxStory = {
    fighterId: "nyx",
    title: "ECLIPSE",
    blurb: "A lua foi engolida. Nyx corta o espaço entre um passo e o outro.",
    ending: "O vazio não deixa rastros. A lua continua engolida.",
    beats: [
        {
            chapter: "I",
            title: "Atraso",
            intro: "Kharon chegou cedo. Nyx nunca chega — ela já passou. O templo ainda pinga.",
            winLine: "A sentença atrasou. A lâmina não.",
            opponentId: "kharon",
            stageId: "temple",
            difficulty: "easy",
        },
        {
            chapter: "II",
            title: "Sino quebrado",
            intro: "Draven fecha o fosso. Nyx corta o espaço entre os golpes. A floresta observa.",
            winLine: "O sino não tocou. Só o vazio.",
            opponentId: "draven",
            stageId: "forest",
            difficulty: "hard",
        },
        {
            chapter: "III",
            title: "Veredito invertido",
            intro: "A foice outra vez, na nave preta. Desta vez o nome na lista é o do carrasco.",
            winLine: "O verdugo cai no próprio altar.",
            opponentId: "kharon",
            stageId: "cathedral",
            difficulty: "brutal",
        },
        {
            chapter: "IV",
            title: "Lua morta",
            intro: "A fortaleza. Sem rastros. Sem testemunhas. O ferro espera no topo.",
            winLine: "A fortaleza esquece. Nyx já foi embora.",
            opponentId: "draven",
            stageId: "fortress",
            difficulty: "nightmare",
        },
    ],
};
const dravenStory = {
    fighterId: "draven",
    title: "O SINO",
    blurb: "No fosso, o ferro não se ajoelha. Draven sobe até o sino da fortaleza.",
    ending: "O sino tocou. Draven ainda está de pé. O ferro não se ajoelha.",
    beats: [
        {
            chapter: "I",
            title: "Primeiro round",
            intro: "Nyx entra no fosso como se o chão não existisse. Os punhos existem.",
            winLine: "A assassina pisou no ferro. O ferro não cede.",
            opponentId: "nyx",
            stageId: "industrial",
            difficulty: "easy",
        },
        {
            chapter: "II",
            title: "A dívida",
            intro: "Kharon veio cobrar. Draven não recua. A arena abandonada vira ringue.",
            winLine: "A foice encontrou o clinch. A dívida mudou de dono.",
            opponentId: "kharon",
            stageId: "abandoned",
            difficulty: "hard",
        },
        {
            chapter: "III",
            title: "Clinch na nave",
            intro: "A assassina volta na catedral. Os punhos já conhecem o vazio.",
            winLine: "O eclipse quebrou nos dentes de ferro.",
            opponentId: "nyx",
            stageId: "cathedral",
            difficulty: "brutal",
        },
        {
            chapter: "IV",
            title: "Sino da fortaleza",
            intro: "O carrasco espera no topo. O ferro sobe a escada. O sino já sabe o nome.",
            winLine: "O verdugo cai. O sino toca para o boxeador.",
            opponentId: "kharon",
            stageId: "fortress",
            difficulty: "nightmare",
        },
    ],
};
const vesperaStory = {
    fighterId: "vespera", title: "O ALTAR VAZIO",
    blurb: "Os sinos da Catedral Negra chamam por uma rainha que se recusa a servir.",
    ending: "Vespera desfaz o último pacto. O altar permanece vazio: pela primeira vez, o sangue pertence a quem o carrega.",
    beats: [
        { chapter: "I", title: "O preço do véu", intro: "Nyx roubou o selo da catedral. Vespera encontra suas pegadas na floresta profana.", winLine: "O selo volta. A ladra revela quem pagou por ele.", opponentId: "nyx", stageId: "forest", difficulty: "easy" },
        { chapter: "II", title: "Ferro consagrado", intro: "Draven guarda o portão industrial. O ferro de seus punhos foi forjado com o sino roubado.", winLine: "O sino partido ainda canta. Vespera reconhece a voz do carrasco.", opponentId: "draven", stageId: "industrial", difficulty: "hard" },
        { chapter: "III", title: "A sentença da rainha", intro: "Kharon invade a Catedral Negra para cobrar o pacto. Vespera transforma o altar em tribunal.", winLine: "A sentença cai sobre o cobrador. Resta destruir o contrato original.", opponentId: "kharon", stageId: "cathedral", difficulty: "brutal" },
        { chapter: "IV", title: "Sangue livre", intro: "Na fortaleza, Draven protege o contrato sob ordem do torneio. Vespera atravessa o último portão.", winLine: "O contrato se dissolve no véu. Nenhuma coroa vale uma alma cativa.", opponentId: "draven", stageId: "fortress", difficulty: "nightmare" },
    ],
};
const gorrStory = {
    fighterId: "gorr",
    title: "A FOME",
    blurb: "As correntes quebraram. Agora Gorr procura quem construiu a jaula.",
    ending: "A fortaleza perdeu as grades. Gorr descobre que liberdade também pode pesar toneladas.",
    beats: [
        { chapter: "I", title: "Porta arrombada", intro: "Draven bloqueia o corredor industrial. Gorr não pede passagem.", winLine: "O ferro abriu espaço.", opponentId: "draven", stageId: "industrial", difficulty: "easy" },
        { chapter: "II", title: "Caçadora de gigantes", intro: "Shai recebeu contrato para derrubar o Devorador antes que ele chegue ao templo.", winLine: "O futuro dela não previu o peso.", opponentId: "shai", stageId: "temple", difficulty: "hard" },
        { chapter: "III", title: "A sentença", intro: "Kharon reconhece o antigo prisioneiro e tenta devolver as correntes ao pescoço certo.", winLine: "Nenhuma lista segura uma fera livre.", opponentId: "kharon", stageId: "cathedral", difficulty: "brutal" },
        { chapter: "IV", title: "Quebrar a jaula", intro: "A Fortaleza Final foi construída com o sangue de lutadores esquecidos. Gorr chegou para cobrar as paredes.", winLine: "As grades caem. A fome fica.", opponentId: "vespera", stageId: "fortress", difficulty: "nightmare" },
    ],
};
const shaiStory = {
    fighterId: "shai",
    title: "OLHO CARMESIM",
    blurb: "Shai enxerga futuros demais. Um deles termina na Fortaleza Final.",
    ending: "O olho se fecha por um instante. Pela primeira vez, Shai escolhe um futuro em vez de apenas observá-lo.",
    beats: [
        { chapter: "I", title: "Sangue previsto", intro: "Nyx cruza a floresta exatamente como Shai viu. Falta apenas provar que a visão estava certa.", winLine: "Um futuro eliminado.", opponentId: "nyx", stageId: "forest", difficulty: "easy" },
        { chapter: "II", title: "Peso impossível", intro: "Gorr deveria cair no primeiro selo. Ele continua andando. Shai precisa recalcular.", winLine: "Até gigantes deixam rastros.", opponentId: "gorr", stageId: "industrial", difficulty: "hard" },
        { chapter: "III", title: "Véu sobre o olho", intro: "Vespera esconde um caminho que o Olho Carmesim não consegue atravessar.", winLine: "O véu rasgou. O caminho existe.", opponentId: "vespera", stageId: "cathedral", difficulty: "brutal" },
        { chapter: "IV", title: "O futuro que morde", intro: "Kharon espera no fim da linha. Em todas as visões, uma lâmina cai. Shai decide qual.", winLine: "O futuro mudou de dono.", opponentId: "kharon", stageId: "fortress", difficulty: "nightmare" },
    ],
};
const CAMPAIGNS = {
    gorr: gorrStory,
    shai: shaiStory,
    vespera: vesperaStory,
    kharon: kharonStory,
    nyx: nyxStory,
    draven: dravenStory,
};
export function getStory(id) {
    return CAMPAIGNS[id] ?? kharonStory;
}
export function hasStory(id) {
    return Boolean(CAMPAIGNS[id]);
}
export function storyOpponent(p1, opponentId) {
    if (opponentId === p1.id)
        return otherFighter(p1.id);
    return playable.find((p) => p.id === opponentId) ?? otherFighter(p1.id);
}
