import fs from "fs";
import path from "path";
import { checkAdmin, isOwner, getAdminData } from "@/utils/permission";
import { fetchData, state } from "@/events/nro_notify";
import { Bot } from "@/classes/Bot";
import { getConfig, updateConfig } from "@/utils/confignotify";

const ALL_CATEGORIES = ["BOSS", "UPGRADE", "REWARD", "CRYSTALLIZATION", "DIVINE_ITEMS", "SYSTEM", "OTHER"];
// =====================
const SETTINGS_PATH = path.join(process.cwd(), "data/nro_notify_settings.json");
const FILTER_PATH = path.join(process.cwd(), "data/filter.json");

// =====================
// UTILS
// =====================
function readJSON(file: string, defaultValue: any = {}) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return defaultValue;
    }
}

function writeJSON(file: string, data: any) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getThreadID(message: any): string {
    return String(message.threadId || message.threadID || message.chatJid);
}

// =====================
// FORMAT
// =====================
function toBoldText(text: string): string {
    const map: Record<string, string> = {
        a: "𝗮",
        b: "𝗯",
        c: "𝗰",
        d: "𝗱",
        e: "𝗲",
        f: "𝗳",
        g: "𝗴",
        h: "𝗵",
        i: "𝗶",
        j: "𝗷",
        k: "𝗸",
        l: "𝗹",
        m: "𝗺",
        n: "𝗻",
        o: "𝗼",
        p: "𝗽",
        q: "𝗾",
        r: "𝗿",
        s: "𝘀",
        t: "𝘁",
        u: "𝘂",
        v: "𝘃",
        w: "𝘄",
        x: "𝘅",
        y: "𝘆",
        z: "𝘇",
        A: "𝗔",
        B: "𝗕",
        C: "𝗖",
        D: "𝗗",
        E: "𝗘",
        F: "𝗙",
        G: "𝗚",
        H: "𝗛",
        I: "𝗜",
        J: "𝗝",
        K: "𝗞",
        L: "𝗟",
        M: "𝗠",
        N: "𝗡",
        O: "𝗢",
        P: "𝗣",
        Q: "𝗤",
        R: "𝗥",
        S: "𝗦",
        T: "𝗧",
        U: "𝗨",
        V: "𝗩",
        W: "𝗪",
        X: "𝗫",
        Y: "𝗬",
        Z: "𝗭",
        "0": "𝟬",
        "1": "𝟭",
        "2": "𝟮",
        "3": "𝟯",
        "4": "𝟰",
        "5": "𝟱",
        "6": "𝟲",
        "7": "𝟳",
        "8": "𝟴",
        "9": "𝟵",
    };
    return text
        .split("")
        .map(c => map[c] || c)
        .join("");
}

// =====================
// FILTER
// =====================
const getFilter = (): string[] => readJSON(FILTER_PATH, []);
const saveFilter = (data: string[]) => writeJSON(FILTER_PATH, data);

// =====================
// COMMAND
// =====================

export default Bot.createCommand({
    name: "nronoti",

    run: async ({ message, args, reply }) => {
        const threadID = getThreadID(message);
        const cmd = args[0]?.toLowerCase();
        const prefix = "!";
        if (!cmd) {
            const prefix = "!";

            let msg =
                `»»»»» ${toBoldText("NRO NOTIFY")} «««««\n` +
                `──────────────\n` +
                `⚙️ ${toBoldText("SYSTEM")}:\n` +
                `${toBoldText(prefix + "nronoti on")}\n` +
                `${toBoldText(prefix + "nronoti off")}\n` +
                `${toBoldText(prefix + "nronoti status")}\n` +
                `${toBoldText(prefix + "nronoti delay 5")}\n` +
                `${toBoldText(prefix + "nronoti batch 3")}\n\n` +
                `🔍 ${toBoldText("FILTER")}:\n` +
                `${toBoldText(prefix + "nronoti addfilter name")}\n` +
                `${toBoldText(prefix + "nronoti removefilter name")}\n` +
                `${toBoldText(prefix + "nronoti listfilter")}\n\n` +
                `📂 ${toBoldText("CATEGORY")}:\n` +
                `${toBoldText(prefix + "nronoti cat list")}\n` +
                `${toBoldText(prefix + "nronoti cat on BOSS")}\n` +
                `${toBoldText(prefix + "nronoti cat off BOSS")}\n\n` +
                `📦 ${toBoldText("OTHER")}:\n` +
                `${toBoldText(prefix + "nronoti setbox")}\n` +
                `──────────────`;

            await reply(msg);
            return;
        }
        const settings = readJSON(SETTINGS_PATH, {});
        const senderID = String(message.senderId);

        // 🔐 CHẶN NGAY TỪ ĐẦU
        if (!checkAdmin(senderID)) {
            await reply("⛔ Chỉ ADMIN mới được sử dụng lệnh này.");
            return;
        }
        // init config
        if (!settings[threadID]) {
            settings[threadID] = {
                enabled: false,
                delay: 7,
                server: "1 sao",
                categories: ["BOSS", "CRYSTALLIZATION", "DIVINE_ITEMS", "SYSTEM"],
            };
        }

        const current = settings[threadID];

        // ===== SET BOX =====
        if (cmd === "setbox") {
            updateConfig({
                id: String(message.threadId),
            });

            await reply("✅ Set box thành công");
            return;
        }

        // ===== ON/OFF =====
        if (cmd === "on" || cmd === "off") {
            const isOn = cmd === "on";

            if (isOn) {
                try {
                    const data = await fetchData();

                    if (Array.isArray(data) && data.length > 0) {
                        state.lastId = Math.max(...data.map((x: any) => Number(x.id)));
                        console.log("📌 INIT lastId =", state.lastId);
                    }
                } catch (e: any) {
                    console.log("❌ FETCH FAIL:", e.message);
                }
            }

            const newConfig = updateConfig({
                enabled: isOn,
            });

            console.log("💾 CONFIG:", newConfig);

            await reply(isOn ? "✅ ON" : "🚫 OFF");
            return;
        }
        // ===== BATCH =====
        if (cmd === "batch") {
            if (!args[1]) {
                await reply(`📦 Batch: ${getConfig().batch}`);
                return;
            }

            const num = parseInt(args[1]);

            if (isNaN(num) || num <= 0) {
                await reply("⚠️ Batch > 0");
                return;
            }

            const newConfig = updateConfig({
                batch: Math.min(num, 10),
            });

            await reply(`📦 Batch: ${newConfig.batch}`);
            return;
        }

        // ===== STATUS =====
        if (cmd === "status") {
            const c = getConfig();

            await reply(
                `📊 STATUS\n` +
                    `• ON: ${c.enabled}\n` +
                    `• Delay: ${c.delay}s\n` +
                    `• Batch: ${c.batch}\n` +
                    `• Categories: ${c.categories.join(", ")}`,
            );
            return;
        }

        // ===== DELAY =====
        if (cmd === "delay") {
            const sec = parseInt(args[1]);

            if (isNaN(sec) || sec < 0) {
                await reply("⚠️ Delay >= 0");
                return;
            }

            const newConfig = updateConfig({
                delay: Math.min(sec, 10),
            });

            await reply(`⏱ Delay: ${newConfig.delay}s`);
            return;
        }

        // ===== STATUS =====
        if (cmd === "status") {
            await reply(`📊 ${toBoldText("STATUS")}\n` + `• ON: ${current.enabled}\n` + `• Delay: ${current.delay}s`);
            return;
        }

        // ===== FILTER =====
        if (cmd === "addfilter" || cmd === "removefilter") {
            const name = args.slice(1).join(" ");
            if (!name) {
                await reply("⚠️ Nhập từ khóa");
                return;
            }

            let list = getFilter();

            if (cmd === "addfilter") {
                if (list.includes(name)) {
                    await reply("⚠️ Đã tồn tại");
                    return;
                }

                list.push(name);
                saveFilter(list);

                await reply(`✅ ${toBoldText("Added")}: ${name}`);
                return;
            }

            // remove
            if (!list.includes(name)) {
                await reply("❌ Không tồn tại");
                return;
            }

            list = list.filter(f => f !== name);
            saveFilter(list);

            await reply(`🗑 ${toBoldText("Removed")}: ${name}`);
            return;
        }

        if (cmd === "listfilter") {
            const list = getFilter();

            if (!list.length) {
                await reply("📭 Trống");
                return;
            }

            await reply(`📂 ${toBoldText("FILTER LIST")}:\n` + list.map(f => `• ${f}`).join("\n"));
            return;
        }
        // ===== CATEGORY =====
        if (cmd === "cat") {
            const sub = args[1]?.toLowerCase();
            const cat = args[2]?.toUpperCase();

            // ===== ON / OFF =====
            if ((sub === "on" || sub === "off") && cat) {
                if (!ALL_CATEGORIES.includes(cat)) {
                    await reply("❌ Category không tồn tại");
                    return;
                }

                const config = getConfig();
                let newCats = [...config.categories];

                if (sub === "on") {
                    if (!newCats.includes(cat)) newCats.push(cat);
                } else {
                    newCats = newCats.filter(c => c !== cat);
                }

                updateConfig({ categories: newCats });

                await reply(`${sub === "on" ? "✅" : "🚫"} ${cat}`);
                return;
            }
            if (sub === "list") {
                const config = getConfig();
                const enabled = config.categories;

                let msg = "📂 CATEGORY\n\n";

                msg += "✅ Đang bật:\n";
                msg += enabled.length ? enabled.map(c => `• ${c}`).join("\n") : "Không có";

                msg += "\n\n📦 Tất cả:\n";
                msg += ALL_CATEGORIES.map(c => (enabled.includes(c) ? `🟢 ${c}` : `⚫ ${c}`)).join("\n");

                await reply(msg);
                return;
            }
        }

        // ===== HELP =====
    },
});
