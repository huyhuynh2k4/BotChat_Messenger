import axios from "axios";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { Bot } from "@/classes";
import { getConfig, updateConfig } from "@/utils/confignotify";
import { checkFilter, FilterNoti } from "@/utils/filterNoti";
import { saveNewItem } from "@/utils/cache_noti";
import psList from "ps-list";

const API_URL = "http://127.0.0.1:8000/notifications/filter";
const SETTINGS_PATH = path.join(process.cwd(), "data/nro_notify_settings.json");

// Đường dẫn ứng dụng sẽ chạy khi API down quá 3 phút
const FALLBACK_APP_PATH = path.join(process.cwd(), "data/fallback_app_path.txt");

export const state = {
    lastId: 0,
};
async function findRunningFallback(appPath: string) {
    const processes = await psList();

    return processes.find(p => {
        if (!p.cmd) return false;
        return p.cmd.includes(appPath);
    });
}
function killProcess(pid: number) {
    try {
        process.kill(pid);
        console.log("🧨 Killed old fallback PID:", pid);
    } catch (err: any) {
        console.log("❌ Cannot kill process:", err?.message);
    }
}
// =====================
// THEO DÕI TRẠNG THÁI API
// =====================
const apiStatus = {
    lastSuccessTime: Date.now(), // Lần cuối API hoạt động
    isDown: false, // API đang down không
    fallbackLaunched: false, // Đã chạy app fallback chưa
    API_DOWN_THRESHOLD_MS: 1 * 60 * 1000, // 3 phút
};

function getFallbackAppPath(): string {
    try {
        if (fs.existsSync(FALLBACK_APP_PATH)) {
            return fs.readFileSync(FALLBACK_APP_PATH, "utf-8").trim();
        }
    } catch {}
    return "";
}

async function launchFallbackApp() {
    const appPath = getFallbackAppPath();

    if (!appPath) {
        console.log("⚠️ FALLBACK APP PATH không được cấu hình!");
        return;
    }

    if (!fs.existsSync(appPath)) {
        console.log(`⚠️ FALLBACK APP không tồn tại: ${appPath}`);
        return;
    }

    // ==============================
    // 🔥 CHECK APP ĐANG CHẠY KHÔNG
    // ==============================
    const running = await findRunningFallback(appPath);

    if (running) {
        console.log(`⚠️ App đang chạy (PID: ${running.pid}) -> tiến hành kill`);

        killProcess(running.pid);

        // đợi 1 chút cho OS giải phóng
        await new Promise(res => setTimeout(res, 1000));
    }

    console.log(`🚀 Khởi chạy fallback app: ${appPath}`);

    try {
        const child = spawn(appPath, [], {
            detached: true,
            stdio: "ignore",
            shell: true,
        });

        child.unref();

        console.log("✅ FALLBACK APP đã được restart!");
    } catch (err: any) {
        console.log("❌ Không thể khởi chạy FALLBACK APP:", err?.message);
    }
}
function checkApiStatus(success: boolean) {
    if (success) {
        // API hoạt động bình thường -> reset trạng thái
        if (apiStatus.isDown) {
            console.log("✅ API đã hoạt động trở lại!");
        }
        apiStatus.lastSuccessTime = Date.now();
        apiStatus.isDown = false;
        apiStatus.fallbackLaunched = false;
        return;
    }

    // API thất bại -> kiểm tra thời gian down
    const downDuration = Date.now() - apiStatus.lastSuccessTime;
    apiStatus.isDown = true;

    console.log(`⚠️ API DOWN: ${Math.floor(downDuration / 1000)}s / ${apiStatus.API_DOWN_THRESHOLD_MS / 1000}s`);

    if (downDuration >= apiStatus.API_DOWN_THRESHOLD_MS && !apiStatus.fallbackLaunched) {
        apiStatus.fallbackLaunched = true;
        launchFallbackApp();
    }
}

let isLooping = false;

// =====================
function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

// =====================
export async function fetchData() {
    try {
        const res = await axios.post(API_URL, {
            server: "1 sao",
        });

        if (!res.data?.success) {
            checkApiStatus(false);
            return [];
        }

        checkApiStatus(true);
        return res.data.data || [];
    } catch {
        checkApiStatus(false);
        return [];
    }
}

// =====================
async function loop(client: Bot<true>) {
    if (isLooping) {
        console.log("⛔ SKIP: isLooping = true");
        return;
    }

    isLooping = true;
    console.log("\n🔁 LOOP START");

    try {
        const data = await fetchData();

        console.log("📦 FETCH:", data?.length || 0);

        if (!data || data.length === 0) {
            console.log("❌ NO DATA");
            return;
        }

        const config = getConfig();
        console.log("⚙ CONFIG:", config);

        // =========================
        // RESET lastId nếu lệch quá 50
        // =========================
        const maxIdFromApi = Math.max(...data.map((x: any) => Number(x.id)));
        if (state.lastId > maxIdFromApi + 50) {
            console.log(
                `⚠️ lastId (${state.lastId}) lớn hơn maxId API (${maxIdFromApi}) quá 50 -> RESET lastId = ${maxIdFromApi}`,
            );
            state.lastId = maxIdFromApi;
        }

        const newItems = data
            .filter((x: any) => Number(x.id) > state.lastId)
            .sort((a: any, b: any) => Number(a.id) - Number(b.id));

        console.log("🆕 NEW ITEMS:", newItems.length, "lastId:", state.lastId);

        if (newItems.length === 0) {
            console.log("❌ NO NEW ITEMS");
            return;
        }

        const batch = config.enabled ? config.batch : 1;
        const batchSize = Math.max(batch || 1, 1);

        console.log("📊 BATCH SIZE:", batchSize);

        const notiCache = newItems[newItems.length - 1];
        notiCache.time = formatTimePlus3(notiCache.time);
        saveNewItem(notiCache);

        if (!config.enabled) {
            console.log("⛔ CONFIG DISABLED");
            state.lastId = Math.max(...newItems.map((x: any) => Number(x.id)));
            return;
        }

        // =========================
        // FILTER KEYWORD
        // =========================
        const filterKeyword = newItems.filter((item: any) => {
            const isFiltered = checkFilter(item.value);

            if (isFiltered) {
                console.log("🚫 FILTER KEYWORD:", item.value);
            }

            return !isFiltered;
        });

        console.log("🔎 AFTER KEYWORD FILTER:", filterKeyword.length);

        // =========================
        // FILTER CATEGORY
        // =========================
        const validItems = filterKeyword.filter((item: any) => {
            const cat = FilterNoti.getInstance().detectCategory(item.value);

            const isValid = config.categories.includes(cat);

            console.log(`📂 ${item.value} -> CAT: ${cat} -> ${isValid ? "✅" : "❌"}`);

            return isValid;
        });

        console.log("✅ VALID ITEMS:", validItems.length);

        // =========================
        // CHECK BATCH
        // =========================
        if (validItems.length < batchSize) {
            console.log("⛔ NOT ENOUGH BATCH:", validItems.length, "/", batchSize);
            return;
        }

        // =========================
        // BUILD MESSAGE
        // =========================
        const chunk = validItems.slice(0, batchSize);

        console.log(
            "📤 CHUNK:",
            chunk.map((x: any) => x.id),
        );

        const message = chunk
            .map((x: any) => {
                return formatBoss(x.value, x.time);
            })
            .join("\n");

        console.log("📨 MESSAGE:\n", message);

        // =========================
        // SEND
        // =========================
        console.log("SEND TO ID:", config.id);
        try {
            const res = await client.sendMessage(BigInt(config.id), {
                text: message,
            });
            console.log("✅ SENT SUCCESS:", res);
        } catch (err: any) {
            console.log("❌ SEND FAILED:", err?.message);
        }

        // =========================
        // UPDATE LAST ID
        // =========================
        state.lastId = Number(chunk[chunk.length - 1].id);

        console.log("🔄 UPDATE lastId ->", state.lastId);
    } catch (e: any) {
        console.log("💥 LOOP ERROR:", e?.message);
    } finally {
        isLooping = false;
        console.log("🔁 LOOP END\n");
    }
}

let started = false;
function CacheNoti() {
    const data = fetchData();
    if (data == null) return;
    saveNewItem(data);
}

export function startNroLoop(client: Bot<true>) {
    console.log("🚀 START NRO LOOP");

    const run = async () => {
        while (true) {
            try {
                await loop(client);
            } catch (err) {
                console.log("💥 LOOP CRASH:", err);
            }

            const config = getConfig();

            await sleep((config.delay || 5) * 1000);
        }
    };

    run();
}
function formatTimePlus3(timeStr?: string): string {
    if (!timeStr) return "";

    const clean = timeStr.replace(/\.\d+/, "");

    const date = new Date(clean);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh", // 🔥 FIX CHÍNH
    });
}

function formatBoss(value: string, time: string): string {
    if (!value) return "";

    // =========================
    // 🔥 CLEAN TEXT
    // =========================
    value = value.replace(/mọi người đều ngưỡng mộ\.?/gi, "").trim();

    // =========================
    // 🔥 CASE 1: BOSS SPAWN
    // =========================
    if (value.includes("BOSS") && value.includes("vừa xuất hiện")) {
        const bossMatch = value.match(/BOSS\s+(.+?)\s+vừa/);
        const bossName = bossMatch ? bossMatch[1] : "";

        const mapMatch = value.match(/tại\s+(.+)/);
        const mapName = mapMatch ? mapMatch[1] : "";

        return `🔥 BOSS ${bossName} ---- ${mapName} : ${time}`;
    }

    // =========================
    // 🔥 CASE 2: KILL BOSS
    // =========================
    if (value.includes("Đã tiêu diệt được")) {
        return `⚔️ ${value} ---- $00.00`;
    }

    // =========================
    // 🔥 DEFAULT
    // =========================
    return `📢 ${value} `;
}
