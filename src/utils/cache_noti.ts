import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "data/nro_cache.json");

// =====================
function getToday(): string {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

// =====================
function readCache(): Record<string, any> {
    try {
        if (!fs.existsSync(CACHE_PATH)) {
            fs.writeFileSync(CACHE_PATH, JSON.stringify({ lastDate: getToday(), data: {} }, null, 2));
            return { lastDate: getToday(), data: {} };
        }

        const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));

        if (typeof data !== "object") {
            return { lastDate: getToday(), data: {} };
        }

        return {
            lastDate: data.lastDate || getToday(),
            data: data.data || {},
        };
    } catch {
        return { lastDate: getToday(), data: {} };
    }
}

// =====================
function writeCache(data: any) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2));
}

// =====================
// 👉 RESET khi qua ngày mới
function checkNewDay(cache: any) {
    const today = getToday();

    if (cache.lastDate !== today) {
        return {
            lastDate: today,
            data: {},
        };
    }

    return cache;
}

// =====================
// 👉 LƯU ITEM
export function saveNewItem(data: any) {
    let cache = readCache();

    // check ngày mới
    cache = checkNewDay(cache);

    // lưu data
    cache.data[data.value] = data.time;

    writeCache(cache);
}
