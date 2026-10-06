/** Canvas 2D may be GPU accelerated by the browser; no WebGL/WebGPU backend exists yet. */
export function detectRenderer(_accel) {
    return "canvas2d";
}
export function recommendQuality() {
    if (typeof navigator === "undefined")
        return "high";
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory ?? 4;
    let gpuScore = 1;
    try {
        const c = document.createElement("canvas");
        const gl = c.getContext("webgl");
        if (gl) {
            const ext = gl.getExtension("WEBGL_debug_renderer_info");
            const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "";
            const low = /swiftshader|llvmpipe|software|mali-4|adreno 3/i.test(renderer);
            if (low)
                gpuScore = 0;
            else if (/nvidia|radeon|apple m|adreno 7|mali-g/i.test(renderer))
                gpuScore = 2;
        }
    }
    catch {
        /* ignore */
    }
    const score = (cores >= 8 ? 2 : cores >= 4 ? 1 : 0) + (mem >= 8 ? 2 : mem >= 4 ? 1 : 0) + gpuScore;
    if (score <= 2)
        return "low";
    if (score <= 4)
        return "medium";
    if (score <= 5)
        return "high";
    return "ultra";
}
export function get2dContext(canvas, _accel) {
    const ctx = canvas.getContext("2d", {
        alpha: false,
        desynchronized: false,
    });
    if (!ctx)
        throw new Error("Canvas 2D indisponível");
    return ctx;
}
