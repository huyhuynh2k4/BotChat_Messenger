import { Bot } from "@/classes/Bot";
import fs from "fs";
import path from "path";
import type { Message } from "meta-messenger.js";
import { getUserName } from "@/utils/userinfo";
import { checkBox } from "@/utils/permission";
const EXP_PATH = path.join(process.cwd(), "data/exp.json");

let cache: any = null;

const cooldown = new Map<string, number>();
const COOLDOWN_TIME = 5000;

// =====================
function readData() {
    if (cache) return cache;

    if (!fs.existsSync(EXP_PATH)) {
        fs.writeFileSync(EXP_PATH, JSON.stringify({}, null, 2));
        cache = {};
        return cache;
    }

    cache = JSON.parse(fs.readFileSync(EXP_PATH, "utf8"));
    return cache;
}

function saveData() {
    if (!cache) return;
    fs.writeFileSync(EXP_PATH, JSON.stringify(cache, null, 2));
}

// =====================
function getNeedExp(level: number) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

// =====================
export function addExp(userId: string, name: string, amount = 10) {
    const now = Date.now();

    // 🚫 cooldown
    if (cooldown.has(userId)) {
        const last = cooldown.get(userId)!;
        if (now - last < COOLDOWN_TIME) return;
    }

    cooldown.set(userId, now);

    const data = readData();

    if (!data[userId]) {
        data[userId] = {
            name,
            exp: 0,
            level: 1,
            total: 0,
        };
    }

    const user = data[userId];

    // 🔥 cập nhật tên nếu thay đổi
    user.name = name;

    user.exp += amount;
    user.total += amount;

    let leveledUp = false;

    while (user.exp >= getNeedExp(user.level)) {
        user.exp -= getNeedExp(user.level);
        user.level++;
        leveledUp = true;
    }

    saveData();

    return {
        level: user.level,
        exp: user.exp,
        leveledUp,
    };
}

// =====================
export function getUser(userId: string) {
    const data = readData();
    return data[userId] || { name: "Unknown", exp: 0, level: 1, total: 0 };
}

// =====================
export function getTop(limit = 10) {
    const data = readData();

    return Object.entries(data)
        .sort((a: any, b: any) => b[1].total - a[1].total)
        .slice(0, limit);
}

// =====================
// EVENT
// =====================
export default Bot.createEvent({
    eventName: "message",

    emit: async (client, message: Message) => {
        const threadID = String(message.threadId);
        if (!checkBox(threadID)) return;
        const senderID = String(message.senderId);

        if (!senderID) return;

        // ❌ bỏ bot
        if (senderID === String(client.user?.id)) {
            console.log("🤖 BOT → SKIP");
            return;
        }

        if (!message.text) {
            console.log("⏭ NO TEXT");
            return;
        }

        // 🔥 lấy tên thật
        const name = await getUserName(client, senderID);

        console.log(`📩 ${name} (${senderID})`);

        const res = addExp(senderID, name, 10);

        console.log("🎯 EXP:", res);
    },
});
