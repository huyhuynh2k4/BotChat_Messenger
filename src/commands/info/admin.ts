import fs from "fs";
import path from "path";
import { Bot } from "@/classes/Bot";

// 👉 IMPORT UTIL
import { checkAdmin, isOwner, getAdminData } from "@/utils/permission";

// =====================
// TYPES
// =====================
type AdminData = {
    admins: string[];
};

type BoxSettings = {
    boxID?: string;
};

type AdminSettings = Record<string, { only: boolean }>;

// =====================
// PATH
// =====================
const ADMIN_FILE = path.join(process.cwd(), "data/admin.json");
const ADMIN_SETTINGS_PATH = path.join(process.cwd(), "data/admin_settings.json");
const BOX_SETTINGS_PATH = path.join(process.cwd(), "data/boxsetting.json");

// =====================
// JSON UTIL
// =====================
function readJSON<T>(filePath: string, defaultValue: T): T {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 4));
            return defaultValue;
        }
        return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
    } catch (err) {
        console.error("Read JSON error:", err);
        return defaultValue;
    }
}

function writeJSON<T>(filePath: string, data: T): void {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

// =====================
// COMMAND
// =====================
export default Bot.createCommand({
    name: "admin",
    aliases: ["ad"],

    run: async ({ message, args, reply }) => {
        const threadID = String((message as unknown as { senderId?: string | bigint }).senderId || "");
        const senderID = String((message as unknown as { senderId?: string | bigint }).senderId || "");

        const prefix = "!";
        const action = args[0]?.toLowerCase();

        const adminData = getAdminData() as AdminData;

        // =====================
        // GET USER ID
        // =====================
        if (action === "id") {
            await reply(`👤 Your ID: ${senderID}`);
            return;
        }

        // =====================
        // SET BOX (OWNER ONLY)
        // =====================
        if (action === "addbox") {
            if (!isOwner(senderID)) {
                await reply("⛔ Chỉ OWNER mới set box.");
                return;
            }

            const boxData = readJSON<BoxSettings>(BOX_SETTINGS_PATH, {});

            boxData.boxID = threadID;
            writeJSON(BOX_SETTINGS_PATH, boxData);

            await reply(`✅ Đã set box chính.\n📦 ID: ${threadID}`);
            return;
        }

        // =====================
        // ADD ADMIN
        // =====================
        if (action === "add") {
            if (!isOwner(senderID)) {
                await reply("⛔ Chỉ OWNER mới được thêm admin.");
                return;
            }

            const target = args[1];
            if (!target) {
                await reply(`Dùng: ${prefix}admin add [UID]`);
                return;
            }

            if (!adminData.admins.includes(target)) {
                adminData.admins.push(target);
                writeJSON(ADMIN_FILE, adminData);
            }

            await reply("✅ Đã thêm admin.");
            return;
        }

        // =====================
        // REMOVE ADMIN
        // =====================
        if (action === "remove") {
            if (!isOwner(senderID)) {
                await reply("⛔ Chỉ OWNER.");
                return;
            }

            const target = args[1];
            if (!target) {
                await reply(`Dùng: ${prefix}admin remove [UID]`);
                return;
            }

            adminData.admins = adminData.admins.filter(id => id !== target);
            writeJSON(ADMIN_FILE, adminData);

            await reply("🗑️ Đã xoá admin.");
            return;
        }

        // =====================
        // CHECK ADMIN
        // =====================
        if (!checkAdmin(senderID)) {
            await reply("⛔ Bạn không có quyền dùng lệnh này.");
            return;
        }

        // =====================
        // ONLY MODE
        // =====================
        if (action === "only") {
            const status = args[1]?.toLowerCase();
            const settings = readJSON<AdminSettings>(ADMIN_SETTINGS_PATH, {});

            if (status === "on") {
                settings[threadID] = { only: true };
                writeJSON(ADMIN_SETTINGS_PATH, settings);
                await reply("✅ Đã bật ONLY ADMIN.");
                return;
            }

            if (status === "off") {
                delete settings[threadID];
                writeJSON(ADMIN_SETTINGS_PATH, settings);
                await reply("🚫 Đã tắt ONLY ADMIN.");
                return;
            }
        }

        // =====================
        // HELP
        // =====================
        await reply(
            `--- ADMIN SYSTEM ---\n` +
                `${prefix}admin id\n` +
                `${prefix}admin add [uid]\n` +
                `${prefix}admin remove [uid]\n` +
                `${prefix}admin addbox\n` +
                `${prefix}admin only on/off`,
        );
    },
});
