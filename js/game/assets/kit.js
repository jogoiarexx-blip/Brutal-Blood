export const r22 = { columns: 2, rows: 2 };
export const r23 = { columns: 3, rows: 2 };
export const r24 = { columns: 4, rows: 2 };
export const r33 = { columns: 3, rows: 3 };
export const r43 = { columns: 4, rows: 3 };
export const r44 = { columns: 4, rows: 4 };
/** Visual frames mapped onto startup/active/recovery. */
export function phases(n, startN, actN, recN, startup, active, recovery) {
    const out = [];
    const sN = Math.max(1, startN);
    const aN = Math.max(1, actN);
    const rN = Math.max(1, recN);
    for (let f = 0; f < startup + active + recovery; f++) {
        if (f < startup) {
            const t = startup <= 1 ? 0 : f / (startup - 1);
            out.push(Math.min(sN - 1, Math.floor(t * sN)));
        }
        else if (f < startup + active) {
            const t = active <= 1 ? 0 : (f - startup) / Math.max(1, active - 1);
            out.push(Math.min(sN + aN - 1, sN + Math.floor(t * aN)));
        }
        else {
            const t = recovery <= 1 ? 1 : (f - startup - active) / Math.max(1, recovery);
            out.push(Math.min(n - 1, sN + aN + Math.floor(t * rN)));
        }
    }
    return out;
}
export function atkMap(frames, move) {
    const sN = Math.max(1, Math.round(frames * 0.3));
    const aN = Math.max(1, Math.round(frames * 0.4));
    const rN = Math.max(1, frames - sN - aN);
    return phases(frames, sN, aN, rN, move.startup, move.active, move.recovery);
}
export function loopPose(extra = {}) {
    return { loop: true, ...extra };
}
