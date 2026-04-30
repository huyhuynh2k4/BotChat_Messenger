import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data/nro_notify_settings.json");

function readJSON(file: string, def: any) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(def, null, 2));
            return def;
        }
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return def;
    }
}

function writeJSON(file: string, data: any) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ✅ KHÔNG IMPORT GÌ KHÁC → tránh vòng
let globalConfig = readJSON(SETTINGS_PATH, {
    id: "",
    enabled: false,
    delay: 5,
    batch: 1,
    server: "1 sao",
    categories: ["BOSS", "UPGRADE", "CRYSTALLIZATION", "DIVINE_ITEMS", "SYSTEM", "OTHER"],
});

export function getConfig() {
    return globalConfig;
}

export function updateConfig(patch: Partial<typeof globalConfig>) {
    globalConfig = { ...globalConfig, ...patch };
    writeJSON(SETTINGS_PATH, globalConfig);
    console.log("Updated config:", globalConfig.enabled);
    return globalConfig;
}
