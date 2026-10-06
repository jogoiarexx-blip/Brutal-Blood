/** A bounded, deterministic input tape. Pausing never advances this clock. */
export class TrainingRecorder {
    mode = 'idle';
    frames = [];
    cursor = 0;
    limit = 600;
    record() { this.frames = []; this.cursor = 0; this.mode = 'record'; }
    play() { if (this.frames.length) {
        this.cursor = 0;
        this.mode = 'play';
    } }
    stop(input) { this.mode = 'idle'; input.replay('p2', null); }
    tick(input) {
        if (this.mode === 'record') {
            input.replay('p2', null);
            this.frames.push(input.sample('p2').filter((a) => a !== 'pause'));
            if (this.frames.length >= this.limit)
                this.stop(input);
        }
        else if (this.mode === 'play') {
            input.replay('p2', this.frames[this.cursor]);
            this.cursor = (this.cursor + 1) % this.frames.length;
        }
    }
    get label() {
        return `${this.mode === 'record' ? 'GRAVANDO P2' : this.mode === 'play' ? 'REPETINDO' : 'FITA'} · ${(this.frames.length / 60).toFixed(1)}s`;
    }
}
