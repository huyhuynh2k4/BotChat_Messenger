import fs from "fs";
import path from "path";
import { Bot } from "@/classes/Bot";

const CACHE_PATH = path.join(process.cwd(), "data/nro_cache.json");

function checkDataAdvanced(name: string, baseTime: string) {
    const cache = readCache();

    const keyword = normalize(name);

    const result: { msg: string; time: string; diff: number }[] = [];

    const base = parseTimeToMinutes(baseTime);

    for (const msg in cache) {
        const time = cache[msg];

        const normMsg = normalize(msg);

        if (!normMsg.includes(keyword)) continue;

        if (!inRange(time, baseTime)) continue;

        const t = parseTimeToMinutes(time);

        result.push({
            msg,
            time,
            diff: Math.abs(t - base),
        });
    }

    result.sort((a, b) => a.diff - b.diff);

    return result.map(x => `🕒 ${x.time} → ${x.msg}`);
}

function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD") // tách dấu
        .replace(/[\u0300-\u036f]/g, ""); // xóa dấu
}
function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function inRange(t: string, base: string): boolean {
    const baseMin = parseTimeToMinutes(base);
    const target = parseTimeToMinutes(t);

    const min = baseMin - 30;
    const max = baseMin + 30;

    return target >= min && target <= max;
}

function readCache(): Record<string, string> {
    try {
        if (!fs.existsSync(CACHE_PATH)) return {};
        return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    } catch {
        return {};
    }
}

export default Bot.createCommand({
    name: "check",

    run: async ({ message, args, reply }) => {
        if (!args.length) {
            await reply("⚠️ Dùng: check <keyword> [HH:mm]");
            return;
        }

        const last = args[args.length - 1];

        let name: string;
        let inputTime: string | undefined;

        if (/^\d{2}:\d{2}$/.test(last)) {
            inputTime = last;
            name = args.slice(0, -1).join(" ");
        } else {
            name = args.join(" ");
        }

        if (!name) {
            await reply("⚠️ Dùng: check <keyword> [HH:mm]");
            return;
        }

        let baseTime: string;

        // =====================
        // ✔ có time → dùng luôn
        // =====================
        if (inputTime) {
            if (!/^\d{2}:\d{2}$/.test(inputTime)) {
                await reply("⚠️ Time phải dạng HH:mm");
                return;
            }

            baseTime = inputTime;
        }

        // =====================
        // ✔ không có → dùng time message
        // =====================
        else {
            const ts = message.timestampMs || Date.now(); // fallback

            baseTime = formatTimeFromMessage(Number(ts));
        }

        const result = checkDataAdvanced(name, baseTime);

        if (result.length === 0) {
            await reply("❌ Không tìm thấy");
            return;
        }

        await reply(`🔍 Keyword: ${name}\n` + `⏱ Time: ${baseTime} → +30 phút\n\n` + result.join("\n\n"));
    },
});
function formatTimeFromMessage(timestamp: number): string {
    console.log("formatTimeFromMessage ->", new Date(timestamp), timestamp);
    const date = new Date(timestamp);

    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");

    return `${h}:${m}`;
}
