export class AudioManager {
    ctx = null;
    master = null;
    buses = {
        music: null, sfx: null, voice: null, ambient: null, ui: null,
    };
    settings;
    unlocked = false;
    musicTimer = null;
    ambientTimer = null;
    musicOn = false;
    intensity = 0;
    focused = true;
    setIntensity(value) { this.intensity = Math.max(0, Math.min(1, value)); }
    setFocus(focused) { this.focused = focused; this.apply(this.settings); }
    constructor(settings) {
        this.settings = settings;
    }
    unlock() {
        if (typeof window === "undefined")
            return;
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC({ latencyHint: "interactive" });
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            Object.keys(this.buses).forEach((k) => {
                const g = this.ctx.createGain();
                g.connect(this.master);
                this.buses[k] = g;
            });
            this.apply(this.settings);
        }
        if (this.ctx.state === "suspended")
            void this.ctx.resume();
        this.unlocked = true;
        this.startAmbient();
    }
    apply(s) {
        this.settings = s;
        if (!this.master || !this.ctx)
            return;
        const mute = s.muted ? 0 : 1;
        const curve = (v) => v * v;
        this.master.gain.setTargetAtTime(curve(s.master) * mute * (this.focused ? 1 : 0.15), this.ctx.currentTime, 0.02);
        this.buses.music?.gain.setTargetAtTime(curve(s.music), this.ctx.currentTime, 0.02);
        this.buses.sfx?.gain.setTargetAtTime(curve(s.sfx), this.ctx.currentTime, 0.02);
        this.buses.voice?.gain.setTargetAtTime(curve(s.voice), this.ctx.currentTime, 0.02);
        this.buses.ambient?.gain.setTargetAtTime(curve(s.ambient), this.ctx.currentTime, 0.02);
        this.buses.ui?.gain.setTargetAtTime(curve(s.ui), this.ctx.currentTime, 0.02);
    }
    resume() {
        if (this.ctx?.state === "suspended")
            void this.ctx.resume();
    }
    context() {
        return this.ctx;
    }
    playBuffer(buffer, bus = "sfx", vol = 0.8) {
        if (!this.unlocked || !this.ctx || !this.bus(bus))
            return;
        const t = this.ctx.currentTime;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        src.connect(g);
        g.connect(this.bus(bus));
        src.start(t);
        src.onended = () => {
            src.disconnect();
            g.disconnect();
        };
    }
    bus(name) {
        return this.buses[name];
    }
    tone(freq, dur, type, vol, bus, slide = 0) {
        if (!this.unlocked || !this.ctx || !this.bus(bus))
            return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slide)
            osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(this.bus(bus));
        osc.start(t);
        osc.stop(t + dur + 0.02);
        osc.onended = () => {
            osc.disconnect();
            g.disconnect();
        };
    }
    noise(dur, vol, bus, hp = 400) {
        if (!this.unlocked || !this.ctx || !this.bus(bus))
            return;
        const t = this.ctx.currentTime;
        const n = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++)
            data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = hp;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.bus(bus));
        src.start(t);
        src.stop(t + dur);
        src.onended = () => {
            src.disconnect();
            filter.disconnect();
            g.disconnect();
        };
    }
    uiMove() { this.tone(520, 0.06, "square", 0.04, "ui"); }
    uiConfirm() { this.tone(220, 0.12, "sawtooth", 0.06, "ui", 180); }
    uiBack() { this.tone(180, 0.1, "triangle", 0.05, "ui", -80); }
    /** Layered swing cue. Keeps attacks from all sounding like the same dry noise burst. */
    attack(button, type = "normal") {
        if (type === "super") {
            this.super();
            return;
        }
        if (type === "special") {
            this.special();
            return;
        }
        if (type === "throw") {
            this.noise(0.09, 0.055, "sfx", 420);
            this.tone(115, 0.08, "triangle", 0.04, "sfx", -25);
            return;
        }
        const heavy = button === "heavy" || button === "kickHeavy";
        const kick = button === "kickLight" || button === "kickHeavy";
        this.noise(heavy ? 0.11 : 0.065, heavy ? 0.07 : 0.045, "sfx", kick ? 520 : 780);
        this.tone(kick ? (heavy ? 105 : 175) : (heavy ? 130 : 220), heavy ? 0.09 : 0.055, "triangle", heavy ? 0.045 : 0.028, "sfx", kick ? -50 : 35);
    }
    hit(heavy = false) {
        // Crack + body + sub layer. Inspired by classic arcade layering, synthesized from scratch.
        this.noise(heavy ? 0.16 : 0.085, heavy ? 0.19 : 0.11, "sfx", heavy ? 150 : 520);
        this.noise(heavy ? 0.035 : 0.022, heavy ? 0.08 : 0.05, "sfx", 1800);
        this.tone(heavy ? 76 : 148, heavy ? 0.13 : 0.075, "square", heavy ? 0.13 : 0.065, "sfx", heavy ? -28 : -18);
        if (heavy)
            this.tone(45, 0.16, "sine", 0.11, "sfx", -5);
    }
    grunt(heavy = false) {
        const base = heavy ? 78 : 104;
        this.tone(base + Math.random() * 18, heavy ? 0.18 : 0.11, "sawtooth", heavy ? 0.045 : 0.025, "voice", -22);
    }
    thump() {
        this.tone(52, 0.18, "sine", 0.16, "sfx", -8);
        this.noise(0.12, 0.08, "sfx", 90);
    }
    block() {
        this.tone(560, 0.06, "square", 0.05, "sfx", -220);
        this.tone(120, 0.08, "triangle", 0.035, "sfx", -30);
        this.noise(0.06, 0.075, "sfx", 1250);
    }
    whoosh() { this.noise(0.08, 0.05, "sfx", 800); }
    special() {
        this.tone(125, 0.24, "sawtooth", 0.1, "sfx", 310);
        this.tone(260, 0.14, "triangle", 0.05, "sfx", -70);
        this.noise(0.18, 0.1, "sfx", 300);
    }
    super() {
        this.tone(58, 0.52, "sawtooth", 0.16, "sfx", 220);
        this.tone(180, 0.4, "square", 0.08, "sfx", 400);
        this.noise(0.32, 0.14, "sfx", 130);
    }
    roundCue(round, final = false) {
        const root = final ? 82 : 96 + Math.min(3, round - 1) * 5;
        this.tone(root, 0.22, "sawtooth", 0.06, "voice", 28);
        this.tone(root * 1.5, 0.18, "triangle", 0.035, "voice", -18);
    }
    fightCue() {
        this.tone(92, 0.2, "square", 0.07, "voice", 210);
        this.noise(0.11, 0.055, "sfx", 650);
    }
    dangerCue() {
        this.tone(54, 0.16, "sine", 0.055, "ui", -8);
        window.setTimeout(() => this.tone(54, 0.13, "sine", 0.04, "ui", -5), 120);
    }
    ko() {
        this.tone(70, 0.65, "sine", 0.18, "voice", -32);
        this.tone(48, 0.5, "square", 0.055, "voice", -10);
        this.noise(0.42, 0.16, "sfx", 80);
    }
    finish() {
        this.tone(90, 0.8, "sawtooth", 0.14, "voice", 80);
        this.tone(45, 0.75, "sine", 0.08, "voice", -8);
        this.noise(0.5, 0.12, "sfx", 100);
    }
    victory() {
        this.tone(110, 0.22, "triangle", 0.055, "voice", 120);
        window.setTimeout(() => this.tone(165, 0.34, "triangle", 0.05, "voice", 70), 120);
    }
    jump() { this.tone(240, 0.08, "triangle", 0.05, "sfx", 120); }
    land() { this.noise(0.07, 0.05, "sfx", 180); this.tone(62, 0.06, "sine", 0.03, "sfx", -6); }
    startMusic() {
        if (this.musicOn)
            return;
        this.musicOn = true;
        this.tickMusic();
    }
    stopMusic() {
        this.musicOn = false;
        if (this.musicTimer)
            window.clearTimeout(this.musicTimer);
    }
    tickMusic() {
        if (!this.musicOn || !this.ctx)
            return;
        const root = 55 + this.intensity * 10;
        const notes = [0, 0, 3, 7, 10, 7, 3, 0];
        const i = Math.floor(Math.random() * notes.length);
        this.tone(root * Math.pow(2, notes[i] / 12), 0.35, "sawtooth", 0.035, "music", 0);
        if (Math.random() < 0.4)
            this.tone(root * 2 * Math.pow(2, notes[(i + 4) % notes.length] / 12), 0.2, "triangle", 0.02, "music");
        this.musicTimer = window.setTimeout(() => this.tickMusic(), 380 - this.intensity * 140);
    }
    startAmbient() {
        if (this.ambientTimer)
            return;
        const loop = () => {
            this.noise(1.2, 0.025, "ambient", 80);
            this.ambientTimer = window.setTimeout(loop, 1100);
        };
        loop();
    }
    dispose() {
        this.stopMusic();
        if (this.ambientTimer)
            window.clearTimeout(this.ambientTimer);
        void this.ctx?.close();
        this.ctx = null;
    }
}
