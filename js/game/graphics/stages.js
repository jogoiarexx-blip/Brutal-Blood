import { drawStageDepth, drawStageTrim } from "./stageDetails.js";
export const STAGES = [
    { id: "abandoned", name: "Arena Abandonada", sky: ["#120e18", "#41151c", "#080609"], haze: "#61151f", floor: "#110a0d", accent: "#51212a", props: "ruins" },
    { id: "temple", name: "Templo Sangrento", sky: ["#1a1014", "#5a1824", "#0c0708"], haze: "#8a2030", floor: "#1a0c10", accent: "#6a2430", props: "temple" },
    { id: "industrial", name: "Distrito Industrial", sky: ["#12141a", "#2a3038", "#08090b"], haze: "#4a5560", floor: "#14161a", accent: "#3a4048", props: "industrial" },
    { id: "forest", name: "Floresta Profana", sky: ["#0c1410", "#16301c", "#060806"], haze: "#1e4a28", floor: "#0c140e", accent: "#245030", props: "forest" },
    { id: "cathedral", name: "Catedral Negra", sky: ["#100c18", "#241838", "#08060c"], haze: "#3a2860", floor: "#100c14", accent: "#2a2040", props: "cathedral" },
    { id: "fortress", name: "Fortaleza Final", sky: ["#140c0c", "#401414", "#080404"], haze: "#801818", floor: "#140808", accent: "#501010", props: "fortress" },
    { id: "prison", name: "Prisão Subterrânea", sky: ["#090e15", "#172937", "#05080d"], haze: "#347589", floor: "#0b1119", accent: "#314656", props: "prison" },
    { id: "city", name: "Cidade em Ruínas", sky: ["#1b1011", "#59352c", "#10090b"], haze: "#a45336", floor: "#191114", accent: "#64483c", props: "city" },
];
export function getStage(id) {
    return STAGES.find((s) => s.id === id) ?? STAGES.find((s) => s.id === "abandoned");
}
export function drawStage(ctx, stage, t, camX, fx) {
    const g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, stage.sky[0]);
    g.addColorStop(0.52, stage.sky[1]);
    g.addColorStop(1, stage.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(-80, -40, 1440, 800);
    const par = camX * 0.35;
    ctx.fillStyle = "#0c0910";
    ctx.fillRect(-80, 0, 1440, 90);
    if (fx) {
        ctx.fillStyle = stage.haze + "55";
        ctx.beginPath();
        ctx.arc(640 - par * 0.4, 190 + Math.sin(t * 0.4) * 6, 96, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12090d";
        ctx.beginPath();
        ctx.arc(640 - par * 0.4, 190, 68, 0, Math.PI * 2);
        ctx.fill();
    }
    drawStageDepth(ctx, stage, t, camX, fx);
    ctx.save();
    ctx.translate(-par, 0);
    drawProps(ctx, stage);
    ctx.restore();
    ctx.fillStyle = stage.floor;
    ctx.fillRect(-80, 620, 1440, 120);
    ctx.strokeStyle = stage.accent;
    ctx.lineWidth = 2;
    for (let x = -80; x < 1360; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 620);
        ctx.lineTo(x + 40, 720);
        ctx.stroke();
    }
    for (let y = 640; y < 740; y += 23) {
        ctx.beginPath();
        ctx.moveTo(-80, y);
        ctx.lineTo(1360, y);
        ctx.stroke();
    }
    ctx.fillStyle = stage.accent;
    ctx.fillRect(-80, 610, 1440, 10);
    drawStageTrim(ctx, stage, t, fx);
}
function drawProps(ctx, stage) {
    ctx.fillStyle = "#291019";
    switch (stage.props) {
        case "prison":
            for (const x of [80, 400, 760, 1080]) {
                ctx.fillStyle = "#050a10";
                ctx.fillRect(x, 230, 180, 370);
                ctx.strokeStyle = "#354959";
                ctx.lineWidth = 7;
                for (let bar = 0; bar < 6; bar++) {
                    ctx.beginPath();
                    ctx.moveTo(x + 15 + bar * 30, 230);
                    ctx.lineTo(x + 15 + bar * 30, 600);
                    ctx.stroke();
                }
                ctx.fillStyle = "#243442";
                ctx.fillRect(x - 8, 225, 196, 18);
                ctx.fillRect(x - 8, 580, 196, 16);
            }
            break;
        case "city":
            for (let i = 0; i < 7; i++) {
                const x = i * 200 - 60, top = 160 + (i * 97 % 170);
                ctx.fillStyle = i % 2 ? "#291e23" : "#34232a";
                ctx.fillRect(x, top, 135, 620 - top);
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x + 32, top - 30);
                ctx.lineTo(x + 56, top + 12);
                ctx.lineTo(x + 108, top - 15);
                ctx.lineTo(x + 135, top);
                ctx.fill();
                ctx.fillStyle = "#c8774945";
                for (let row = 0; row < 4; row++)
                    for (let col = 0; col < 3; col++)
                        if ((row + col + i) % 3)
                            ctx.fillRect(x + 15 + col * 37, top + 35 + row * 65, 18, 30);
            }
            break;
        case "ruins":
            for (let x = -30; x < 1320; x += 86)
                ctx.fillRect(x, 335, 48, 225 + (x % 172 ? 28 : 0));
            break;
        case "temple":
            ctx.fillStyle = "#3a1018";
            for (const x of [120, 280, 980, 1140]) {
                ctx.fillRect(x, 220, 36, 400);
                ctx.fillRect(x - 10, 210, 56, 18);
            }
            ctx.fillRect(500, 260, 280, 24);
            break;
        case "industrial":
            ctx.fillStyle = "#222830";
            ctx.fillRect(80, 280, 220, 340);
            ctx.fillRect(980, 240, 180, 380);
            ctx.strokeStyle = "#3a4450";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(300, 300);
            ctx.lineTo(980, 260);
            ctx.stroke();
            break;
        case "forest":
            ctx.fillStyle = "#0e2414";
            for (let x = 40; x < 1240; x += 90) {
                ctx.fillRect(x, 250, 22, 370);
                ctx.beginPath();
                ctx.arc(x + 11, 250, 48, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case "cathedral":
            ctx.fillStyle = "#1a1228";
            ctx.fillRect(180, 160, 80, 460);
            ctx.fillRect(1020, 160, 80, 460);
            ctx.fillStyle = "#2a1848";
            ctx.beginPath();
            ctx.moveTo(480, 300);
            ctx.lineTo(640, 140);
            ctx.lineTo(800, 300);
            ctx.fill();
            ctx.fillStyle = "#4a2060";
            ctx.fillRect(600, 300, 80, 310);
            break;
        case "fortress":
            ctx.fillStyle = "#301010";
            ctx.fillRect(40, 200, 240, 420);
            ctx.fillRect(1000, 180, 240, 440);
            for (let i = 0; i < 6; i++)
                ctx.fillRect(40 + i * 40, 170, 24, 30);
            ctx.fillStyle = "#501818";
            ctx.fillRect(500, 340, 280, 280);
            break;
    }
}
