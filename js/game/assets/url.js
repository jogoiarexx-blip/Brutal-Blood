/** Resolve assets relative to index.html. Works on GitHub Pages repository subfolders. */
export function assetUrl(path) {
    const clean = path.replace(/^\//, "");
    return new URL(`assets/${clean}`, document.baseURI).href;
}
