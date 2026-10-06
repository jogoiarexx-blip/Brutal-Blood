import { assets } from "./AssetManager.js";
import { getCharacterAssets } from "./manifests.js";
import { getStageAssets } from "./stages.js";
export function collectFightJobs(req) {
    const jobs = [];
    const seen = new Set();
    const add = (job) => {
        if (!job.url || seen.has(job.url))
            return;
        seen.add(job.url);
        jobs.push(job);
    };
    for (const id of [req.p1, req.p2]) {
        const man = getCharacterAssets(id);
        if (man.portrait)
            add({ key: `${id}:portrait`, url: man.portrait, kind: "portrait", critical: false });
        const idleSrc = man.clips.idle?.src || man.clips.idle?.fallbackSrc;
        if (idleSrc)
            add({ key: `${id}:idle`, url: idleSrc, kind: "sheet", critical: true });
        for (const clip of Object.values(man.clips)) {
            if (clip.src)
                add({ key: `${id}:${clip.name}`, url: clip.src, kind: "sheet", critical: false });
            if (clip.fallbackSrc)
                add({ key: `${id}:fb:${clip.name}`, url: clip.fallbackSrc, kind: "sheet", critical: false });
            if (clip.maskSrc)
                add({ key: `${id}:mask:${clip.name}`, url: clip.maskSrc, kind: "sheet", critical: false });
        }
        for (const fx of man.effects)
            add({ key: `${id}:fx:${fx}`, url: fx, kind: "effect", critical: false });
        for (const a of man.audio)
            add({ key: `${id}:sfx:${a}`, url: a, kind: "audio", critical: false });
    }
    const stage = getStageAssets(req.stage);
    if (stage.backdrop)
        add({ key: `stage:${stage.id}`, url: stage.backdrop, kind: "stage", critical: false });
    if (stage.music)
        add({ key: `stage:music:${stage.id}`, url: stage.music, kind: "audio", critical: false });
    for (const fx of stage.effects ?? [])
        add({ key: `stage:fx:${fx}`, url: fx, kind: "effect", critical: false });
    return jobs;
}
export async function loadFightAssets(req, opts = {}) {
    const jobs = collectFightJobs(req);
    const failed = [];
    const criticalFailed = [];
    const acquired = [];
    let cached = 0;
    const releasePartial = () => {
        assets.releaseAll(acquired);
        acquired.length = 0;
    };
    const report = (loaded, current) => {
        const total = Math.max(1, jobs.length);
        opts.onProgress?.({
            loaded,
            total,
            percent: Math.round((loaded / total) * 100),
            current,
            failed,
            cached,
        });
    };
    if (jobs.length === 0)
        report(1, "pronto");
    let done = 0;
    try {
        for (const job of jobs) {
            if (opts.signal?.aborted) {
                releasePartial();
                throw new DOMException("Aborted", "AbortError");
            }
            report(done, job.url);
            const already = job.kind === "audio" ? assets.hasAudio(job.url) : assets.hasImage(job.url);
            try {
                if (job.kind === "audio") {
                    await assets.loadAudio(job.url, opts.audioContext ?? null, opts.signal);
                }
                else {
                    await assets.loadImage(job.url, opts.signal);
                }
                acquired.push(job.url);
                if (already)
                    cached += 1;
            }
            catch (e) {
                if (opts.signal?.aborted) {
                    releasePartial();
                    throw new DOMException("Aborted", "AbortError");
                }
                const error = e instanceof Error ? e.message : String(e);
                failed.push({ url: job.url, error });
                if (job.critical) {
                    criticalFailed.push({ url: job.url, error });
                    throw new Error(`Asset crítico falhou: ${job.url}`);
                }
            }
            done += 1;
            report(done, job.url);
        }
    }
    catch (e) {
        if (e?.name === "AbortError")
            throw e;
        releasePartial();
        throw e;
    }
    if (criticalFailed.length) {
        releasePartial();
        const err = new Error(`Asset crítico falhou: ${criticalFailed[0].url}`);
        throw err;
    }
    assets.sweep();
    const packFor = (id) => {
        const man = getCharacterAssets(id);
        const images = new Map();
        const take = (url) => {
            if (!url)
                return;
            const img = assets.getImage(url);
            if (img)
                images.set(url, img);
        };
        take(man.portrait);
        for (const clip of Object.values(man.clips)) {
            take(clip.src);
            take(clip.fallbackSrc);
            take(clip.maskSrc);
        }
        return { id, clips: man.clips, images };
    };
    const stage = getStageAssets(req.stage);
    const stageImages = new Map();
    if (stage.backdrop) {
        const img = assets.getImage(stage.backdrop);
        if (img)
            stageImages.set(stage.backdrop, img);
    }
    const audio = new Map();
    for (const job of jobs) {
        if (job.kind !== "audio")
            continue;
        const buf = assets.getAudio(job.url);
        if (buf)
            audio.set(job.url, buf);
    }
    return {
        p1: packFor(req.p1),
        p2: packFor(req.p2),
        stageImages,
        audio,
        keys: acquired,
        failed,
        criticalFailed,
    };
}
export function releaseFightAssets(pack) {
    if (!pack || pack.released)
        return;
    pack.released = true;
    assets.releaseAll(pack.keys);
    pack.keys = [];
    assets.sweep();
}
