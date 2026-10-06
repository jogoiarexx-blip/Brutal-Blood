import { GAME } from "../core/config.js";
export class Fighter {
    data;
    name;
    x;
    y;
    prevX;
    prevY;
    vx = 0;
    vy = 0;
    w = 76;
    h = 150;
    facing = 1;
    isAI = false;
    maxHealth;
    health;
    meter = 0;
    superMeter = 0;
    state = "idle";
    stateTime = 0;
    attack = null;
    attackFrame = 0;
    hitDone = false;
    hitsLanded = 0;
    grounded = true;
    blocking = false;
    crouching = false;
    hitFlash = 0;
    stun = 0;
    roundWins = 0;
    invuln = 0;
    dashTime = 0;
    comboHits = 0;
    comboDamage = 0;
    maxCombo = 0;
    comboTimer = 0;
    lastHitWasCounter = false;
    cancelReady = false;
    introT = 0;
    finishVictim = false;
    scaleX = 1;
    scaleY = 1;
    /** 0–1 squash applied on top of scale during/after hitstop. */
    impactSquash = 0;
    throwLock = 0;
    airHits = 0;
    wakeupKind = "normal";
    juggleGravity = 1;
    statuses = new Map();
    comboRoute = [];
    comboRouteTimer = 0;
    /** Visual only. Never changes hitboxes or frame data. */
    paletteId = "default";
    skin = "default";
    constructor({ x, y, facing = 1, data, isAI = false }) {
        this.data = data;
        this.name = data.name;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.facing = facing;
        this.isAI = isAI;
        this.maxHealth = data.stats.maxHealth;
        this.health = this.maxHealth;
    }
    reset(x, facing, keepMeter = false) {
        this.x = x;
        this.y = GAME.FLOOR - this.h;
        this.prevX = this.x;
        this.prevY = this.y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.health = this.maxHealth;
        if (!keepMeter) {
            this.meter = 0;
            this.superMeter = 0;
        }
        this.state = "idle";
        this.stateTime = 0;
        this.attack = null;
        this.attackFrame = 0;
        this.hitDone = false;
        this.hitsLanded = 0;
        this.grounded = true;
        this.blocking = false;
        this.crouching = false;
        this.stun = 0;
        this.hitFlash = 0;
        this.invuln = 0;
        this.dashTime = 0;
        this.comboHits = 0;
        this.comboDamage = 0;
        this.comboTimer = 0;
        this.cancelReady = false;
        this.finishVictim = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.impactSquash = 0;
        this.throwLock = 0;
        this.airHits = 0;
        this.wakeupKind = "normal";
        this.juggleGravity = 1;
        this.statuses.clear();
        this.comboRoute = [];
        this.comboRouteTimer = 0;
    }
    setStatus(id, duration, data = {}) {
        this.statuses.set(id, { id, remaining: duration, ...data });
    }
    hasStatus(id) {
        return (this.statuses.get(id)?.remaining ?? 0) > 0;
    }
    getStatus(id) {
        return this.hasStatus(id) ? this.statuses.get(id) : undefined;
    }
    consumeStatus(id) {
        if (!this.hasStatus(id))
            return false;
        this.statuses.delete(id);
        return true;
    }
    statusLabels() {
        return [...this.statuses.values()].filter((s) => s.remaining > 0).map((s) => s.label ?? s.id);
    }
    noteComboMove(moveId) {
        if (this.comboRouteTimer <= 0)
            this.comboRoute = [];
        if (this.comboRoute.at(-1) !== moveId || this.hitsLanded === 0)
            this.comboRoute.push(moveId);
        if (this.comboRoute.length > 10)
            this.comboRoute.shift();
        this.comboRouteTimer = GAME.COMBO_DROP + 0.7;
        for (const combo of this.data.combos ?? []) {
            if (combo.sequence.length > this.comboRoute.length)
                continue;
            const tail = this.comboRoute.slice(-combo.sequence.length);
            if (tail.every((id, i) => id === combo.sequence[i]))
                return combo;
        }
        return null;
    }
    canAct() {
        return this.stun <= 0 && !["attack", "hit", "ko", "knockdown", "wakeup", "throw", "thrown", "finish", "victory", "counter"].includes(this.state);
    }
    canCancel(into) {
        if (!this.cancelReady || this.state !== "attack" || !this.attack)
            return false;
        return this.attack.cancelInto?.includes(into) ?? false;
    }
    move(dir) {
        if (!this.canAct() || this.blocking || this.crouching || !this.grounded)
            return;
        const min = 30;
        const max = GAME.WIDTH - 30 - this.w;
        if ((dir < 0 && this.x <= min + 1) || (dir > 0 && this.x >= max - 1)) {
            this.vx = 0;
            if (this.state === "walk" || this.state === "walkBack")
                this.state = "idle";
            return;
        }
        const toward = Math.sign(dir) === this.facing;
        const spd = toward ? this.data.stats.speed : this.data.stats.backSpeed;
        this.vx = dir * spd;
        this.state = dir ? (toward ? "walk" : "walkBack") : "idle";
    }
    stop() {
        if (this.canAct() && this.grounded && !this.blocking && !this.crouching) {
            this.vx = 0;
            this.state = "idle";
        }
    }
    crouch(on) {
        if (!this.grounded)
            return;
        if (!this.canAct() && this.state !== "crouch" && this.state !== "block")
            return;
        this.crouching = on;
        if (this.blocking || this.state === "block") {
            this.vx = 0;
            return;
        }
        if (on) {
            this.vx = 0;
            this.state = "crouch";
        }
        else if (this.state === "crouch")
            this.state = "idle";
    }
    jump() {
        if (this.grounded && this.canAct() && !this.blocking && !this.crouching) {
            this.vy = -this.data.stats.jump;
            this.grounded = false;
            this.state = "jump";
        }
    }
    dash(dir) {
        if (!this.canAct() || !this.grounded || this.blocking)
            return;
        this.dashTime = 0.18;
        this.vx = dir * this.data.stats.dashSpeed;
        this.state = "dash";
        this.crouching = false;
    }
    block(on) {
        if (this.state === "ko" || this.state === "finish")
            return;
        if (!this.canAct() && this.state !== "block" && this.state !== "wakeup")
            return;
        this.blocking = on;
        if (on && this.grounded) {
            this.vx = 0;
            this.state = "block";
        }
        else if (this.state === "block")
            this.state = "idle";
    }
    startAttack(move, cancel = false) {
        if (!move)
            return false;
        if (this.blocking)
            return false;
        if (move.type === "throw" && !move.commandGrab && this.throwLock > 0)
            return false;
        if (this.state === "wakeup" && !this.isReversal(move) && !cancel)
            return false;
        if (!cancel && !this.canAct() && this.state !== "taunt" && this.state !== "wakeup")
            return false;
        if (move.cost && this.meter < move.cost)
            return false;
        if (move.superCost && this.superMeter < move.superCost)
            return false;
        if (move.cost)
            this.meter -= move.cost;
        if (move.superCost)
            this.superMeter -= move.superCost;
        this.crouching = false;
        this.attack = move;
        this.state = move.type === "throw" ? "throw" : move.type === "counter" ? "counter" : move.type === "taunt" ? "taunt" : "attack";
        this.stateTime = 0;
        this.attackFrame = 0;
        this.hitDone = false;
        this.hitsLanded = 0;
        this.cancelReady = false;
        this.vx = move.advance ? this.facing * move.advance * 0.25 : 0;
        if (move.invuln)
            this.invuln = move.invuln * GAME.FRAME;
        return true;
    }
    isReversal(move) {
        if (this.state !== "wakeup")
            return false;
        return move.type === "super" || move.type === "counter" || !!move.invuln || !!move.antiAir;
    }
    tech(fromX) {
        this.state = "idle";
        this.attack = null;
        this.attackFrame = 0;
        this.cancelReady = false;
        this.blocking = false;
        this.crouching = false;
        this.stun = 8 * GAME.FRAME;
        this.invuln = 10 * GAME.FRAME;
        this.vx = Math.sign(this.x - fromX || this.facing) * 280;
        this.hitFlash = 0.1;
    }
    takeHit(move, fromX, scaled, blocked, counter = false) {
        if (this.state === "ko" || this.state === "finish" || this.invuln > 0)
            return { dmg: 0, blocked: true };
        const def = this.data.stats.defense;
        let dmg = (move.damage * scaled) / def;
        let kb = move.knockback;
        this.lastHitWasCounter = counter;
        if (blocked) {
            dmg *= 0.18;
            kb *= 0.22;
            if (move.type !== "special" && move.type !== "super" && move.type !== "finish") {
                dmg = this.health <= 1 ? 0 : Math.min(dmg, this.health - 1);
            }
            this.meter = Math.min(100, this.meter + 8);
            this.superMeter = Math.min(100, this.superMeter + 4);
            this.hitFlash = 0.05;
            this.stun = move.blockStun * GAME.FRAME;
        }
        else {
            this.state = move.knockdown ? "knockdown" : "hit";
            this.stun = (move.hitStun + (counter ? 4 : 0)) * GAME.FRAME;
            this.hitFlash = 0.12;
            this.crouching = false;
            this.blocking = false;
            this.attack = null;
            this.comboHits += 1;
            this.comboDamage += dmg;
            this.maxCombo = Math.max(this.maxCombo, this.comboHits);
            this.comboTimer = GAME.COMBO_DROP + this.stun;
            if (!this.grounded)
                this.airHits += 1;
            if (move.launcher && this.grounded) {
                this.vy = -520;
                this.grounded = false;
            }
            else if (!this.grounded) {
                this.juggleGravity = Math.min(2.4, 1 + this.airHits * 0.22);
                this.vy = Math.min(this.vy, -180 / this.juggleGravity);
            }
        }
        this.health = Math.max(0, this.health - dmg);
        this.vx = Math.sign(this.x - fromX) * kb;
        this.superMeter = Math.min(100, this.superMeter + (blocked ? 3 : 6) + (counter ? 4 : 0));
        this.meter = Math.min(100, this.meter + (blocked ? 2 : 5));
        if (this.health <= 0) {
            this.state = "ko";
            this.blocking = false;
            this.attack = null;
            this.vx = Math.sign(this.x - fromX) * 520;
            this.vy = -520;
            this.grounded = false;
        }
        return { dmg, blocked };
    }
    /** Damage lands, the swing stays. Super and grab never call this. */
    absorbArmor(move, fromX, scaled) {
        const dmg = (move.damage * scaled) / this.data.stats.defense;
        this.health = Math.max(0, this.health - dmg);
        this.hitFlash = 0.16;
        this.superMeter = Math.min(100, this.superMeter + 5);
        this.meter = Math.min(100, this.meter + 4);
        const dir = Math.sign(this.x - fromX) || -this.facing;
        this.vx = dir * Math.min(70, move.knockback * 0.08);
        if (this.health <= 0) {
            this.state = "ko";
            this.blocking = false;
            this.attack = null;
            this.vx = dir * 520;
            this.vy = -520;
            this.grounded = false;
        }
        return { dmg, blocked: false };
    }
    gainOnHit(move, hits) {
        this.meter = Math.min(100, this.meter + (move.meterGain || 0));
        this.superMeter = Math.min(100, this.superMeter + (move.superGain || 8) + hits * 2);
    }
    update(dt, frozen = false) {
        this.prevX = this.x;
        this.prevY = this.y;
        if (frozen && this.state !== "attack") {
            this.hitFlash = Math.max(0, this.hitFlash - dt);
            this.impactSquash *= Math.exp(-10 * dt);
            return;
        }
        this.stateTime += dt;
        this.attackFrame += 1;
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.stun = Math.max(0, this.stun - dt);
        this.invuln = Math.max(0, this.invuln - dt);
        this.throwLock = Math.max(0, this.throwLock - dt);
        this.comboTimer = Math.max(0, this.comboTimer - dt);
        this.comboRouteTimer = Math.max(0, this.comboRouteTimer - dt);
        for (const [id, status] of this.statuses) {
            status.remaining -= dt;
            if (status.remaining <= 0)
                this.statuses.delete(id);
        }
        this.impactSquash *= Math.exp(-14 * dt);
        if (this.impactSquash < 0.02)
            this.impactSquash = 0;
        if (this.comboTimer <= 0 && this.state !== "hit" && this.state !== "knockdown") {
            this.comboHits = 0;
            this.comboDamage = 0;
        }
        if (this.dashTime > 0) {
            this.dashTime -= dt;
            if (this.dashTime <= 0 && this.state === "dash")
                this.state = "idle";
        }
        if (!this.grounded)
            this.vy += GAME.GRAVITY * this.juggleGravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.x = Math.max(30, Math.min(GAME.WIDTH - 30 - this.w, this.x));
        if (this.y + this.h >= GAME.FLOOR) {
            const wasAir = !this.grounded;
            this.y = GAME.FLOOR - this.h;
            this.vy = 0;
            this.grounded = true;
            this.airHits = 0;
            this.juggleGravity = 1;
            if (this.state === "jump")
                this.state = "idle";
            if (wasAir && this.state !== "ko" && this.state !== "knockdown" && this.state !== "wakeup") {
                this.impactSquash = Math.max(this.impactSquash, 0.42);
            }
            if (this.state === "knockdown" && this.stun <= 0) {
                this.state = "wakeup";
                this.stateTime = 0;
                const frames = this.wakeupKind === "quick" ? 8 : this.wakeupKind === "delay" ? 16 : GAME.WAKEUP_INVULN;
                this.invuln = Math.max(this.invuln, frames * GAME.FRAME);
            }
            if (wasAir && this.state === "ko")
                this.vx *= 0.4;
        }
        const wakeLen = this.wakeupKind === "quick" ? 0.18 : this.wakeupKind === "delay" ? 0.55 : 0.35;
        if (this.state === "wakeup" && this.stateTime > wakeLen) {
            this.state = "idle";
            this.wakeupKind = "normal";
        }
        const a = this.attack;
        if ((this.state === "attack" || this.state === "throw" || this.state === "counter" || this.state === "taunt") && a) {
            const total = a.startup + a.active + a.recovery;
            if (this.attackFrame > total) {
                this.state = "idle";
                this.attack = null;
                this.attackFrame = 0;
                this.cancelReady = false;
            }
            if (a.advance && this.attackFrame >= a.startup && this.attackFrame < a.startup + a.active) {
                this.x += this.facing * a.advance * dt;
            }
        }
        if (this.state === "hit" && this.stun <= 0)
            this.state = "idle";
        if (["ko", "hit", "knockdown", "thrown"].includes(this.state))
            this.vx *= 0.96;
        else if (!["walk", "walkBack", "dash"].includes(this.state))
            this.vx *= 0.72;
        const breath = 1 + Math.sin(this.stateTime * 6) * 0.015;
        this.scaleY = this.state === "crouch" ? 0.82 : this.state === "jump" ? 1.08 : breath;
        this.scaleX = this.state === "crouch" ? 1.12 : this.state === "jump" ? 0.92 : 1;
    }
    /** Presentation-only tick while the match is in hitstop. */
    presentFrozen(dt) {
        this.hitFlash = Math.max(this.hitFlash, this.state === "hit" || this.state === "knockdown" || this.state === "ko" ? 0.14 : 0.05);
        this.impactSquash = Math.max(this.impactSquash * Math.exp(-3 * dt), 0.32);
    }
    getAttackBox() {
        if (!this.attack || this.hitDone)
            return null;
        if (!["attack", "throw", "counter"].includes(this.state))
            return null;
        const a = this.attack;
        if (this.attackFrame < a.startup || this.attackFrame >= a.startup + a.active)
            return null;
        if (a.projectile)
            return null;
        const airborne = !this.grounded;
        const range = a.range * this.data.stats.range * (airborne ? 0.78 : 1);
        const low = a.height === "low" && !airborne;
        const y = this.y + (low ? this.h * 0.58 : a.antiAir ? -12 : airborne ? this.h * 0.22 : this.h * 0.16);
        const h = a.antiAir ? this.h * 0.78 : low ? this.h * 0.4 : airborne ? this.h * 0.48 : this.h * 0.64;
        return {
            x: this.facing > 0 ? this.x + this.w * 0.55 : this.x + this.w * 0.45 - range,
            y,
            w: range,
            h,
        };
    }
    getHurtBox() {
        const crouch = this.crouching || this.state === "crouch";
        return {
            x: this.x + 8,
            y: this.y + (crouch ? 48 : 0),
            w: this.w - 16,
            h: this.h - (crouch ? 48 : 0),
        };
    }
    isBlockingHeight(height) {
        if (!this.blocking || !this.grounded)
            return false;
        if (height === "low" && !this.crouching)
            return false;
        if (height === "high" && this.crouching)
            return false;
        return true;
    }
}
export function intersects(a, b) {
    return !!(a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
}
