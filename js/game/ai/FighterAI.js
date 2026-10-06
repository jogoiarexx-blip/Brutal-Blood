const PROFILES = {
    veryEasy: { reaction: 0.42, aggression: 0.22, block: 0.12, combo: 0.0, special: 0.04, super: 0.0, punish: 0.0, readRange: 140 },
    easy: { reaction: 0.3, aggression: 0.38, block: 0.28, combo: 0.18, special: 0.12, super: 0.0, punish: 0.1, readRange: 170 },
    normal: { reaction: 0.18, aggression: 0.55, block: 0.42, combo: 0.45, special: 0.28, super: 0.18, punish: 0.32, readRange: 210 },
    hard: { reaction: 0.13, aggression: 0.7, block: 0.6, combo: 0.72, special: 0.42, super: 0.42, punish: 0.58, readRange: 250 },
    brutal: { reaction: 0.1, aggression: 0.84, block: 0.74, combo: 0.88, special: 0.58, super: 0.68, punish: 0.8, readRange: 290 },
    nightmare: { reaction: 0.08, aggression: 0.92, block: 0.86, combo: 0.96, special: 0.72, super: 0.88, punish: 0.92, readRange: 330 },
};
export class FighterAI {
    f;
    difficulty;
    think = 0;
    blockTime = 0;
    queue = [];
    queueDelay = 0;
    mode = "normal";
    sawHit = false;
    onAttack;
    reset() {
        this.think = 0;
        this.blockTime = 0;
        this.queue = [];
        this.queueDelay = 0;
        this.sawHit = false;
        this.f.block(false);
        this.f.crouch(false);
    }
    constructor(fighter, difficulty = "normal") {
        this.f = fighter;
        this.difficulty = difficulty;
    }
    setDifficulty(d) {
        this.difficulty = d;
    }
    update(dt, enemy) {
        if (this.f.health <= 0 || this.f.state === "ko" || this.f.state === "finish")
            return;
        if (this.mode === "stand") {
            this.f.stop();
            this.f.block(false);
            return;
        }
        if (this.mode === "block") {
            this.f.block(true);
            this.f.stop();
            return;
        }
        if (this.mode === "blockFirst") {
            if (this.f.comboHits > 0 || this.sawHit) {
                this.sawHit = true;
                this.f.block(true);
                this.f.stop();
                return;
            }
            this.f.block(false);
            this.f.stop();
            return;
        }
        if (this.mode === "blockRandom") {
            if (Math.random() < 0.55)
                this.f.block(true);
            else
                this.f.block(false);
            this.f.stop();
            return;
        }
        if (this.mode === "crouch") {
            this.f.block(false);
            this.f.crouch(true);
            return;
        }
        if (this.mode === "attackAfterBlock") {
            if (this.f.state === "block" && enemy.state !== "attack") {
                this.f.block(false);
                this.tryMove("light");
                return;
            }
            if (enemy.state === "attack") {
                this.f.block(true);
                this.f.stop();
                return;
            }
            this.f.block(false);
            this.f.stop();
            return;
        }
        if (this.mode === "jump") {
            this.f.block(false);
            if (this.f.grounded)
                this.f.jump();
            return;
        }
        if (this.mode === "attack") {
            this.f.block(false);
            const dx = Math.sign(enemy.x - this.f.x);
            if (Math.abs(enemy.x - this.f.x) > 90)
                this.f.move(dx);
            else
                this.tryMove("light");
            return;
        }
        if (this.mode === "reversal") {
            this.f.block(false);
            this.f.stop();
            if (this.f.state === "wakeup") {
                if (!this.tryMove("counter"))
                    this.tryMove("super") || this.tryMove("special2");
            }
            return;
        }
        const p = PROFILES[this.difficulty];
        if (this.blockTime > 0) {
            this.blockTime -= dt;
            if (this.blockTime <= 0)
                this.f.block(false);
            return;
        }
        if (this.queue.length) {
            this.queueDelay -= dt;
            if (this.queueDelay <= 0) {
                const id = this.queue[0];
                if (this.tryMove(id)) {
                    this.queue.shift();
                    this.queueDelay = 0.04;
                }
                else if (this.f.state !== "attack")
                    this.queue = [];
            }
            return;
        }
        this.think -= dt;
        if (this.think > 0)
            return;
        this.think = p.reaction + Math.random() * p.reaction * 0.45;
        const dx = enemy.x - this.f.x;
        const dist = Math.abs(dx);
        const facingLocked = ["attack", "throw", "counter", "hit", "knockdown", "wakeup", "ko", "finish", "thrown", "victory", "dash"].includes(this.f.state);
        if (!facingLocked)
            this.f.facing = Math.sign(dx) || this.f.facing;
        const enemyAttacking = enemy.state === "attack" && enemy.attack;
        const danger = enemyAttacking && dist < (enemy.attack?.range ?? 90) + 40;
        if (danger && Math.random() < p.block) {
            this.f.crouch(enemy.attack?.height === "low");
            this.f.block(true);
            this.blockTime = 0.1 + Math.random() * 0.18;
            return;
        }
        if (enemyAttacking && enemy.attack && dist < 200 && Math.random() < p.punish && this.isUnsafe(enemy)) {
            this.f.block(false);
            this.punish(dist);
            return;
        }
        this.f.block(false);
        this.f.crouch(false);
        if (this.f.superMeter >= 100 && Math.random() < p.super && dist < this.superRange()) {
            this.tryMove("super");
            return;
        }
        if (!enemy.grounded && dist < 170 && Math.random() < p.punish) {
            this.antiAir();
            return;
        }
        this.space(dist, dx, p);
        if (!this.f.canAct())
            return;
        if (Math.random() > p.aggression)
            return;
        this.press(dist, dx, p, enemy);
    }
    superRange() {
        const move = this.f.data.moves.super;
        return (move?.range ?? 180) + 40;
    }
    punish(dist) {
        if (dist > 110)
            this.tryMove(this.preferredSpecial()) || this.tryMove("heavy");
        else
            this.tryMove("heavy") || this.tryMove("light");
    }
    antiAir() {
        const id = this.f.data.id;
        if (id === "draven" || id === "vespera" || id === "nyx")
            this.tryMove("special2") || this.tryMove("heavy");
        else if (id === "shai")
            this.tryMove("special3") || this.tryMove("heavy");
        else
            this.tryMove("heavy") || this.tryMove("special2");
    }
    preferredSpecial() {
        const id = this.f.data.id;
        if (id === "vespera" || id === "shai")
            return "special1";
        if (id === "gorr")
            return "special1";
        if (id === "nyx")
            return "special1";
        return "special1";
    }
    space(dist, dx, p) {
        const id = this.f.data.id;
        const normals = Object.values(this.f.data.moves).filter((m) => m.type === "normal");
        const reach = Math.max(80, ...normals.map((m) => m.range)) + 20;
        if (id === "vespera" || id === "shai") {
            const projectile = this.bestProjectile();
            if (dist > 180 && projectile && Math.random() < p.special) {
                this.tryMove(projectile);
                if (id === "shai" && Math.random() < 0.35)
                    this.f.move(-Math.sign(dx));
                return;
            }
            if (dist < 90)
                this.f.move(-Math.sign(dx));
            else if (dist > reach)
                this.f.move(Math.sign(dx));
            else
                this.f.stop();
            return;
        }
        if (id === "nyx") {
            if (dist > reach) {
                if (Math.random() < 0.2)
                    this.f.dash(Math.sign(dx));
                else
                    this.f.move(Math.sign(dx));
                return;
            }
            if (dist < 70 && Math.random() < 0.4) {
                this.f.dash(-Math.sign(dx));
                return;
            }
        }
        if (id === "gorr" || id === "kharon") {
            if (dist > 70)
                this.f.move(Math.sign(dx));
            else
                this.f.stop();
            return;
        }
        if (id === "draven") {
            if (dist > 110)
                this.f.move(Math.sign(dx));
            else if (dist < 50 && Math.random() < 0.25)
                this.f.move(-Math.sign(dx));
            else
                this.f.stop();
            return;
        }
        if (dist > reach && dist <= p.readRange) {
            const ranged = this.bestProjectile();
            if (ranged && Math.random() < p.special && this.tryMove(ranged))
                return;
            this.f.move(Math.sign(dx));
            return;
        }
        if (dist > p.readRange) {
            this.f.move(Math.sign(dx));
            if (Math.random() < 0.04)
                this.f.jump();
            return;
        }
        if (dist < 70 && Math.random() < 0.28) {
            this.f.move(-Math.sign(dx));
            return;
        }
        this.f.stop();
    }
    press(dist, dx, p, _enemy) {
        const id = this.f.data.id;
        if (id === "gorr" && dist < 70 && Math.random() < 0.28) {
            this.tryMove("special2") || this.tryMove("throw");
            return;
        }
        if (id === "draven" && dist < 62 && Math.random() < 0.22) {
            this.tryMove("special3") || this.tryMove("throw");
            return;
        }
        if (dist < 56 && Math.random() < 0.2) {
            this.tryMove("throw");
            return;
        }
        const r = Math.random();
        if (id === "nyx") {
            if (r < 0.38) {
                this.tryMove("light");
                if (Math.random() < p.combo)
                    this.queueCombo();
            }
            else if (r < 0.55)
                this.tryMove("kickLight");
            else if (r < 0.7)
                this.tryMove("medium");
            else if (this.f.meter >= 25 && Math.random() < p.special)
                this.tryMove(this.f.data.specials[Math.floor(Math.random() * this.f.data.specials.length)]);
            else
                this.tryMove("heavy");
            return;
        }
        if (id === "vespera" || id === "shai") {
            if (r < 0.35 && this.f.meter >= 25)
                this.tryMove(this.bestProjectile() || "special1");
            else if (r < 0.6)
                this.tryMove("light");
            else if (r < 0.8)
                this.tryMove("medium");
            else
                this.tryMove("heavy");
            return;
        }
        if (id === "gorr") {
            if (r < 0.3) {
                this.tryMove("light");
                if (Math.random() < p.combo)
                    this.queueCombo();
            }
            else if (r < 0.5)
                this.tryMove("medium");
            else if (r < 0.7)
                this.tryMove("heavy");
            else if (this.f.meter >= 30)
                this.tryMove("special1");
            else
                this.tryMove("kickHeavy");
            return;
        }
        if (id === "draven") {
            if (r < 0.45) {
                this.tryMove("light");
                if (Math.random() < p.combo)
                    this.queueCombo();
            }
            else if (r < 0.65)
                this.tryMove("medium");
            else if (r < 0.8)
                this.tryMove("heavy");
            else
                this.tryMove("kickLight");
            return;
        }
        if (r < 0.42) {
            this.tryMove("light");
            if (Math.random() < p.combo)
                this.queueCombo();
        }
        else if (r < 0.62)
            this.tryMove("medium");
        else if (r < 0.78)
            this.tryMove("heavy");
        else if (r < 0.88)
            this.tryMove("kickHeavy");
        else if (this.f.meter >= 30 && Math.random() < p.special) {
            const spec = this.f.data.specials[Math.floor(Math.random() * this.f.data.specials.length)];
            if (spec)
                this.tryMove(spec);
        }
    }
    bestProjectile() {
        const found = Object.values(this.f.data.moves).find((m) => m.projectile && m.type === "special" && this.f.meter >= (m.cost ?? 0));
        return found?.id;
    }
    isUnsafe(enemy) {
        const a = enemy.attack;
        if (!a)
            return false;
        const leftover = a.startup + a.active + a.recovery - enemy.attackFrame;
        return leftover >= 10 && enemy.hitDone;
    }
    queueCombo() {
        const advanced = this.difficulty === "brutal" || this.difficulty === "nightmare";
        const list = this.f.data.combos.filter((c) => c.sequence[0] === "light" &&
            (advanced || c.level === "basic" || c.level === "intermediate") &&
            c.sequence.every((id) => !!this.f.data.moves[id]));
        if (!list.length)
            return;
        const c = list[Math.floor(Math.random() * list.length)];
        this.queue = c.sequence.slice(1);
        this.queueDelay = 0.09;
    }
    tryMove(id) {
        const m = this.f.data.moves[id];
        if (!m)
            return false;
        const ok = this.f.startAttack(m, this.f.state === "attack" && this.f.canCancel(id));
        if (ok)
            this.onAttack?.(m);
        return ok;
    }
}
