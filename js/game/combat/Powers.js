import { GAME } from "../core/config.js";

function opponent(match, fighter) {
    return fighter === match.p1 ? match.p2 : match.p1;
}

function clampX(fighter, x) {
    return Math.max(30, Math.min(GAME.WIDTH - 30 - fighter.w, x));
}

function burst(match, fighter, count = 10) {
    match.particles.spawn(fighter.x + fighter.w / 2, fighter.y + fighter.h * 0.42, count, fighter.data.accent, true);
}

const POWERSETS = {
    kharon: {
        beforeHit({ def, move }) {
            if (!def.hasStatus("executionMark"))
                return move;
            if (!["heavy", "special1", "super"].includes(move.id))
                return move;
            return {
                ...move,
                damage: Math.round(move.damage * 1.12),
                hitStun: move.hitStun + 5,
                knockback: move.knockback + 70,
                launcher: move.id === "special1" ? true : move.launcher,
                armorBreak: true,
                _powerConsume: "executionMark",
            };
        },
        afterHit({ match, att, def, move, effective }) {
            if (move.id === "special3") {
                def.setStatus("executionMark", 5.0, { source: att.data.id, label: "MARCA" });
                match.noteEvent("MARCA DO CARRASCO");
                burst(match, def, 9);
            }
            if (effective._powerConsume && def.consumeStatus(effective._powerConsume)) {
                match.noteEvent("EXECUÇÃO");
                match.camera.addTrauma(0.22);
                burst(match, def, 14);
            }
        },
    },
    nyx: {
        onAttackStart({ match, fighter, move }) {
            if (move.id !== "special1")
                return;
            const foe = opponent(match, fighter);
            if (!foe.hasStatus("shadowMark"))
                return;
            const behind = foe.x - foe.facing * (fighter.w + 24);
            fighter.x = clampX(fighter, behind);
            fighter.prevX = fighter.x;
            fighter.facing = -foe.facing;
            fighter.invuln = Math.max(fighter.invuln, 6 * GAME.FRAME);
            foe.consumeStatus("shadowMark");
            match.noteEvent("PASSO SOMBRIO");
            match.particles.spawn(fighter.x + fighter.w / 2, fighter.y + 58, 12, fighter.data.accent, false);
        },
        afterHit({ match, att, def, move }) {
            if (move.id === "special3") {
                def.setStatus("shadowMark", 4.2, { source: att.data.id, label: "SOMBRA" });
                match.noteEvent("ALVO SOMBRIO");
            }
        },
    },
    draven: {
        beforeHit({ att, move }) {
            if (!att.hasStatus("bloodRush") || move.id === "special3" || move.type === "throw")
                return move;
            return {
                ...move,
                damage: Math.round(move.damage * 1.10),
                hitStun: move.hitStun + 2,
                blockStun: move.blockStun + 2,
                _bloodRush: true,
            };
        },
        onAttackStart({ fighter, move }) {
            if (fighter.hasStatus("bloodRush") && move.id === "special1")
                fighter.invuln = Math.max(fighter.invuln, 3 * GAME.FRAME);
        },
        afterHit({ match, att, move, effective }) {
            if (move.id === "special3") {
                att.setStatus("bloodRush", 5.5, { source: att.data.id, label: "FÚRIA" });
                att.meter = Math.min(100, att.meter + 18);
                match.noteEvent("FÚRIA DE SANGUE");
                burst(match, att, 12);
            }
            else if (effective._bloodRush && move.id === "special1") {
                att.meter = Math.min(100, att.meter + 6);
            }
        },
    },
    vespera: {
        onAttackStart({ match, fighter, move }) {
            if (move.id !== "special3")
                return;
            const altar = match.projectiles.find((p) => p.owner === fighter && p.kind === "altar" && !p.hit && p.life > 0);
            if (!altar)
                return;
            altar.kind = "altarBurst";
            altar.vx = 0;
            const oldW = altar.w;
            const oldH = altar.h;
            altar.w = 176;
            altar.h = 92;
            altar.x -= (altar.w - oldW) / 2;
            altar.y -= (altar.h - oldH) / 2;
            altar.prevX = altar.x;
            altar.prevY = altar.y;
            altar.life = Math.min(altar.life, 0.24);
            altar.damage = Math.round(altar.damage * 1.28);
            altar.knock = Math.round(altar.knock * 1.25);
            altar.hitstop = Math.max(8, altar.hitstop);
            altar.move = { ...altar.move, name: "Ruptura do Altar", knockdown: true, hitStun: altar.move.hitStun + 4 };
            match.noteEvent("RUPTURA DO ALTAR");
            match.particles.spawn(altar.x + altar.w / 2, altar.y + altar.h / 2, 16, fighter.data.accent, false);
        },
        onProjectileSpawn({ match, projectile }) {
            if (projectile.move.id !== "special2")
                return;
            projectile.vx = 0;
            projectile.life = 3.4;
            projectile.w = 72;
            projectile.h = 58;
            projectile.y = GAME.FLOOR - projectile.h - 6;
            match.noteEvent("ALTAR ATIVO");
        },
    },
    gorr: {
        afterHit({ match, att, move, damage }) {
            if (!["special2", "super"].includes(move.id) || damage <= 0)
                return;
            const ratio = move.id === "super" ? 0.26 : 0.20;
            const healed = Math.min(att.maxHealth - att.health, damage * ratio);
            if (healed <= 0)
                return;
            att.health += healed;
            match.noteEvent("DEVORAR");
            match.particles.bloodBurst(att.x + att.w / 2, att.y + 62, -att.facing, 0.42);
        },
    },
    shai: {
        afterHit({ match, att, move }) {
            if (move.id === "counter") {
                att.setStatus("focus", 6.0, { source: att.data.id, label: "FOCO" });
                match.noteEvent("VISÃO ABERTA");
                burst(match, att, 8);
            }
        },
        onProjectileSpawn({ match, projectile }) {
            const owner = projectile.owner;
            if (projectile.move.id !== "special1" || !owner.hasStatus("focus"))
                return;
            owner.consumeStatus("focus");
            projectile.damage = Math.round(projectile.damage * 1.18);
            projectile.w = Math.round(projectile.w * 1.22);
            projectile.vx *= 1.16;
            projectile.move = {
                ...projectile.move,
                hits: 2,
                hitStun: projectile.move.hitStun + 2,
                knockback: Math.round(projectile.move.knockback * 1.08),
            };
            match.noteEvent("AGULHA PREVISTA");
        },
    },
};

function setFor(fighter) {
    return POWERSETS[fighter?.data?.id] ?? null;
}

export function powerOnAttackStart(match, fighter, move) {
    setFor(fighter)?.onAttackStart?.({ match, fighter, move });
}

export function powerOnProjectileSpawn(match, projectile) {
    setFor(projectile.owner)?.onProjectileSpawn?.({ match, projectile });
}

export function powerBeforeHit(match, att, def, move) {
    return setFor(att)?.beforeHit?.({ match, att, def, move }) ?? move;
}

export function powerAfterHit(match, att, def, move, effective, damage) {
    setFor(att)?.afterHit?.({ match, att, def, move, effective, damage });
}
