import { DEFAULT_BINDINGS, GAMEPAD_DEFAULT, } from "../core/config.js";
const ALL_ACTIONS = [
    "left", "right", "up", "down", "light", "medium", "heavy",
    "kickLight", "kickHeavy", "special", "super", "block", "throw", "taunt", "pause",
];
const ATTACK_ACTIONS = [
    "light", "medium", "heavy", "kickLight", "kickHeavy", "special", "super", "throw", "taunt",
];
export class Input {
    bindings;
    keys = new Set();
    pressed = new Set();
    virtual = new Set();
    virtualPressed = new Set();
    injected = new Set();
    gamepadActions = [new Set(), new Set()];
    gamepadPressed = [new Set(), new Set()];
    gamepadPrev = [new Set(), new Set()];
    pads = [null, null];
    rumble = true;
    attached = false;
    onKeyDown;
    onKeyUp;
    onBlur;
    remapTarget = null;
    onRemap;
    lastDevice = "keyboard";
    history = [];
    frame = 0;
    replaySlots = new Map();
    sample(slot) {
        return ALL_ACTIONS.filter((a) => this.isDown(slot, a) ||
            (this.bindings[slot][a] ?? []).some((c) => this.pressed.has(c)));
    }
    replay(slot, actions) {
        if (!actions) {
            this.replaySlots.delete(slot);
            return;
        }
        const previous = this.replaySlots.get(slot)?.down ?? new Set();
        this.replaySlots.set(slot, { down: new Set(actions), pressed: new Set(actions.filter((a) => !previous.has(a))) });
    }
    constructor(bindings = structuredClone(DEFAULT_BINDINGS)) {
        this.bindings = bindings;
    }
    attach() {
        if (this.attached || typeof window === "undefined")
            return;
        this.attached = true;
        this.onKeyDown = (e) => {
            if (this.remapTarget) {
                e.preventDefault();
                this.finishRemap(e.code);
                return;
            }
            if (e.target?.closest?.("input, select, textarea, [contenteditable=true]"))
                return;
            this.lastDevice = "keyboard";
            if (!this.keys.has(e.code))
                this.pressed.add(e.code);
            this.keys.add(e.code);
            if (this.isGameCode(e.code))
                e.preventDefault();
        };
        this.onKeyUp = (e) => {
            this.keys.delete(e.code);
            this.injected.delete(e.code);
        };
        this.onBlur = () => this.clearAll();
        addEventListener("keydown", this.onKeyDown);
        addEventListener("keyup", this.onKeyUp);
        addEventListener("blur", this.onBlur);
        document.addEventListener("visibilitychange", this.onBlur);
        addEventListener("gamepadconnected", this.onPad);
        addEventListener("gamepaddisconnected", this.onPad);
    }
    detach() {
        if (!this.attached)
            return;
        this.attached = false;
        if (this.onKeyDown)
            removeEventListener("keydown", this.onKeyDown);
        if (this.onKeyUp)
            removeEventListener("keyup", this.onKeyUp);
        if (this.onBlur) {
            removeEventListener("blur", this.onBlur);
            document.removeEventListener("visibilitychange", this.onBlur);
        }
        removeEventListener("gamepadconnected", this.onPad);
        removeEventListener("gamepaddisconnected", this.onPad);
    }
    onPad = () => {
        this.lastDevice = "gamepad";
    };
    beginRemap(slot, action) {
        this.remapTarget = { slot, action };
    }
    finishRemap(code) {
        if (!this.remapTarget)
            return;
        const { slot, action } = this.remapTarget;
        this.bindings[slot][action] = [code];
        this.remapTarget = null;
        this.onRemap?.(code);
    }
    cancelRemap() {
        this.remapTarget = null;
    }
    setVirtual(action, down) {
        if (down) {
            if (!this.virtual.has(action))
                this.virtualPressed.add(action);
            this.virtual.add(action);
        }
        else {
            this.virtual.delete(action);
        }
    }
    injectCodes(codes) {
        const next = new Set(codes);
        for (const c of next) {
            if (!this.injected.has(c) && !this.keys.has(c))
                this.pressed.add(c);
        }
        this.injected = next;
    }
    isGameCode(code) {
        const all = [...Object.values(this.bindings.p1).flat(), ...Object.values(this.bindings.p2).flat()];
        return all.includes(code) || code.startsWith("Arrow") || code === "Space";
    }
    poll() {
        this.frame++;
        this.pollGamepads();
    }
    pollGamepads() {
        if (typeof navigator === "undefined" || !navigator.getGamepads)
            return;
        const list = navigator.getGamepads();
        this.gamepadPrev = [new Set(this.gamepadActions[0]), new Set(this.gamepadActions[1])];
        this.gamepadActions = [new Set(), new Set()];
        this.pads = [list[0] ?? null, list[1] ?? null];
        for (let i = 0; i < 2; i++) {
            const gp = this.pads[i];
            if (!gp)
                continue;
            this.lastDevice = "gamepad";
            const dest = this.gamepadActions[i];
            for (const action of ALL_ACTIONS) {
                if (this.readPad(gp, action)) {
                    dest.add(action);
                    if (!this.gamepadPrev[i].has(action))
                        this.gamepadPressed[i].add(action);
                }
            }
        }
    }
    readPad(gp, action) {
        const map = GAMEPAD_DEFAULT[action];
        if (map.buttons) {
            for (const b of map.buttons) {
                const btn = gp.buttons[b];
                if (btn && (btn.pressed || btn.value > 0.45))
                    return true;
            }
        }
        const ax = map.axes;
        const dz = 0.38;
        if (ax === "lx-")
            return this.stick(gp, 0, 1).x < -dz || gp.buttons[14]?.pressed;
        if (ax === "lx+")
            return this.stick(gp, 0, 1).x > dz || gp.buttons[15]?.pressed;
        if (ax === "ly-")
            return this.stick(gp, 0, 1).y < -dz || gp.buttons[12]?.pressed;
        if (ax === "ly+")
            return this.stick(gp, 0, 1).y > dz || gp.buttons[13]?.pressed;
        return false;
    }
    stick(gp, xAxis, yAxis) {
        const x = gp.axes[xAxis] ?? 0;
        const y = gp.axes[yAxis] ?? 0;
        const m = Math.hypot(x, y);
        const dz = 0.18;
        if (m < dz)
            return { x: 0, y: 0 };
        const scale = ((m - dz) / (1 - dz)) / m;
        return { x: x * scale, y: y * scale };
    }
    isDown(slot, action) {
        if (this.replaySlots.has(slot) && action !== "pause")
            return this.replaySlots.get(slot).down.has(action);
        if (this.virtual.has(action) && slot === "p1")
            return true;
        const codes = this.bindings[slot][action] ?? [];
        for (const c of codes) {
            if (this.keys.has(c) || this.injected.has(c))
                return true;
        }
        const padIndex = slot === "p1" ? 0 : 1;
        return this.gamepadActions[padIndex].has(action);
    }
    consume(slot, action) {
        const replay = this.replaySlots.get(slot);
        if (replay && action !== "pause") {
            const pressed = replay.pressed.delete(action);
            if (pressed)
                this.pushHistory(action);
            return pressed;
        }
        if (this.virtualPressed.has(action) && slot === "p1") {
            this.virtualPressed.delete(action);
            this.pushHistory(action);
            return true;
        }
        const codes = this.bindings[slot][action] ?? [];
        for (const c of codes) {
            if (this.pressed.has(c)) {
                this.pressed.delete(c);
                this.pushHistory(action);
                return true;
            }
        }
        const padIndex = slot === "p1" ? 0 : 1;
        if (this.gamepadPressed[padIndex].has(action)) {
            this.gamepadPressed[padIndex].delete(action);
            this.pushHistory(action);
            return true;
        }
        return false;
    }
    peekPressed(slot) {
        for (const a of ATTACK_ACTIONS) {
            if (this.consume(slot, a))
                return a;
        }
        return null;
    }
    dir(slot) {
        let d = 0;
        if (this.isDown(slot, "left"))
            d -= 1;
        if (this.isDown(slot, "right"))
            d += 1;
        return d;
    }
    numpad(slot, facing) {
        const x = this.dir(slot) * (facing >= 0 ? 1 : -1);
        const y = this.isDown(slot, "up") ? 1 : this.isDown(slot, "down") ? -1 : 0;
        const col = x < 0 ? 0 : x > 0 ? 2 : 1;
        const row = y > 0 ? 2 : y < 0 ? 0 : 1;
        return row * 3 + col + 1;
    }
    endFrame() {
        this.gamepadPressed.forEach((set) => set.clear());
        this.replaySlots.forEach((s) => s.pressed.clear());
        this.pressed.clear();
        this.virtualPressed.clear();
    }
    clearAll() {
        this.replaySlots.clear();
        this.keys.clear();
        this.pressed.clear();
        this.virtual.clear();
        this.virtualPressed.clear();
        this.injected.clear();
        this.gamepadPressed.forEach((set) => set.clear());
    }
    vibrate(slot, duration = 70, strong = 0.5, weak = 0.25) {
        if (!this.rumble)
            return;
        const gp = this.pads[slot === "p1" ? 0 : 1];
        const actuator = gp?.vibrationActuator;
        actuator?.playEffect?.("dual-rumble", {
            duration,
            strongMagnitude: strong,
            weakMagnitude: weak,
            startDelay: 0,
        })?.catch(() => { });
    }
    padConnected(slot) {
        return !!this.pads[slot === "p1" ? 0 : 1];
    }
    pushHistory(action) {
        this.history.push({ label: action, t: this.frame });
        if (this.history.length > 16)
            this.history.shift();
    }
}
