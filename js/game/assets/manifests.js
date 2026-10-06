import { getFighterContent } from "../content/registry.js";
export function getCharacterAssets(id) {
    const found = getFighterContent(id);
    if (found)
        return found.assets;
    const fallback = getFighterContent("kharon");
    if (!fallback)
        throw new Error("Kharon asset fallback missing from content registry");
    return fallback.assets;
}
