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
    if (isLooping) return;
    isLooping = true;

    try {
        const data = await fetchData();
        if (!data.length) return;
        const config = getConfig();
        const newItems = data
            .filter((x: any) => Number(x.id) > state.lastId)
            .sort((a: any, b: any) => Number(a.id) - Number(b.id));

        if (newItems.length === 0) return;
        const batch = config.enabled ? config.batch : 1;
        const batchSize = Math.max(batch || 1, 1);
        const notiCache = newItems[newItems.length - 1];
        notiCache.time = formatTimePlus3(notiCache.time);
        saveNewItem(notiCache);

        if (!config.enabled) {
            state.lastId = Math.max(...newItems.map((x: any) => Number(x.id)));
            return;
        }
        // 👉 lọc category
        const filterKeyword = newItems.filter((item: any) => !checkFilter(item.value));
        const validItems = filterKeyword.filter((item: any) => {
            const cat = FilterNoti.getInstance().detectCategory(item.value);

            return config.categories.includes(cat);
        });

        // 👉 nếu chưa đủ batch thì bỏ qua
        if (validItems.length < batchSize) return;

        // 👉 lấy đúng batchSize item
        const chunk = validItems.slice(0, batchSize);

        const message = chunk.map((x: any) => `📢 ${x.value}`).join("\n");

        await reply(message);

        // 👉 update lastId theo item cuối batch
        state.lastId = Number(chunk[chunk.length - 1].id);

        console.log("UPDATE lastId ->", state.lastId);
    } catch (e: any) {
        console.log("ERR:", e.message);
    } finally {
        isLooping = false;
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
            await sleep(5000);
        }
    },
});

function formatTimePlus3(timeStr: string): string {
    const date = new Date(timeStr);

    // cộng thêm 3 phút
    date.setMinutes(date.getMinutes());

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}
