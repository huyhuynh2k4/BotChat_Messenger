import { platform } from "node:os";
import { resolve } from "node:path";

import { pathToFileURL } from "url";

export const importDefault = async <T>(id: string) => {
    const resolvedPath = platform() === "win32" ? pathToFileURL(resolve(id)).href : id;
    const importModule = await import(resolvedPath);

    return importModule?.default as T | undefined;
};
