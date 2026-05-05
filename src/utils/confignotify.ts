import fs from "fs";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data/nro_notify_settings.json");

export type NotifyConfig = {
    id: string;
    enabled: boolean;
    delay: number;
    batch: number;
    server: string;
    categories: string[];
};

// =====================
// DEFAULT
// =====================
const DEFAULT_CONFIG: NotifyConfig = {
    id: "",
    enabled: false,
    delay: 5,
    batch: 1,
    server: "1 sao",
    categories: ["BOSS", "UPGRADE", "CRYSTALLIZATION", "DIVINE_ITEMS", "SYSTEM", "OTHER"],
};

// =====================
// READ
// =====================
export function getConfig(): NotifyConfig {
    try {
        if (!fs.existsSync(SETTINGS_PATH)) {
            fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
            return DEFAULT_CONFIG;
        }

        const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_CONFIG;
    }
}

// =====================
// WRITE
// =====================
export function updateConfig(patch: Partial<NotifyConfig>): NotifyConfig {
    const current = getConfig();
    const updated = { ...current, ...patch };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));

    console.log("💾 Saved config:", updated);

    return updated;
}
