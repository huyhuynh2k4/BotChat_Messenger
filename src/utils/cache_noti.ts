import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "data/nro_cache.json");

// =====================
function readCache(): Record<string, string> {
    try {
        if (!fs.existsSync(CACHE_PATH)) {
            fs.writeFileSync(CACHE_PATH, JSON.stringify({}, null, 2));
            return {};
        }

        const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));

        return typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch {
        return {};
    }
}

// =====================
function writeCache(data: Record<string, string>) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
}

// =====================
// 👉 LƯU 1 ITEM (value + time)
export function saveNewItem(data: any) {
    const cache = readCache();
    // thêm mới
    cache[data.value] = data.time;

    writeCache(cache);

    // console.log("💾 SAVED:", data.value);
}
