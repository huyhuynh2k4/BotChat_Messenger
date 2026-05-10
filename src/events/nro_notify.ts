import axios from "axios";
import fs from "fs";
import path from "path";
import { Bot } from "@/classes";
import { getConfig, updateConfig } from "@/utils/confignotify";
import { checkFilter, FilterNoti } from "@/utils/filterNoti";
import { saveNewItem } from "@/utils/cache_noti";

const API_URL = "http://127.0.0.1:8000/notifications/filter";
const SETTINGS_PATH = path.join(process.cwd(), "data/nro_notify_settings.json");

export const state = {
    lastId: 0,
};

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

        if (!res.data?.success) return [];

        return res.data.data || [];
    } catch {
        return [];
    }
}

// =====================
async function loop(reply: (msg: string) => Promise<any>) {
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
            const res = await reply(message);
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

export default Bot.createEvent({
    eventName: "message",

    emit: async (client, message) => {
        if (started) return;
        started = true;

        let config = getConfig();
        if (!config.id) return;

        const reply = async (content: string) => {
            return await client.sendMessage(BigInt(config.id), {
                text: content,
            });
        };
        const data = await fetchData();

        if (Array.isArray(data) && data.length > 0) {
            state.lastId = Math.max(...data.map((x: any) => Number(x.id)));
            console.log("📌 INIT lastId =", state.lastId);
        }
        console.log("🚀 START AUTO LOOP");
        while (true) {
            await loop(reply);
            const config = getConfig();
            const delay = (config.delay || 5) * 1000; // default 5s

            await sleep(delay);
        }
    },
});

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
