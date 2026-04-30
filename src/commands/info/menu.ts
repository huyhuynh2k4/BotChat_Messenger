import moment from "moment-timezone";
import chalk from "chalk";
import { Bot } from "@/classes/Bot";

// ===== DEBUG =====
const DEBUG_MENU = true;

function menuLog(step: string, data?: unknown) {
    if (!DEBUG_MENU) return;

    console.log(chalk.green(`[MENU] ${step}`), data ? chalk.gray(JSON.stringify(data, null, 2)) : "");
}

// ===== BOLD TEXT =====
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

// helper type safe (KHÔNG dùng any tràn lan)
function getThreadID(message: any): string {
    return message.threadId || message.threadID || message.chatJid;
}

function getSenderID(message: any): string {
    return message.senderId || message.senderID || message.senderJid;
}

// ===== COMMAND =====
export default Bot.createCommand({
    name: "menu",
    aliases: ["help"],

    run: async ({ message, reply, client }) => {
        const threadID = getThreadID(message);
        const senderID = getSenderID(message);

        menuLog("RUN", { threadID, senderID });

        // ===== CONFIG =====
        const config = (global as any).config;

        const isAdmin = config?.adminUID?.includes(senderID) ?? false;

        const prefix = (global as any).data?.threadData?.get(String(threadID))?.PREFIX || config?.prefix || "!";

        // ===== COMMANDS =====
        const commands = client.commands;

        if (!commands) {
            await reply("❌ Commands chưa được load");
            return;
        }

        const userCommands: string[] = [];
        const adminCommands: string[] = [];

        menuLog("TOTAL COMMANDS", commands.size);

        for (const [, cmd] of commands.entries()) {
            if (!cmd?.name) continue;

            const text = toBoldText(prefix + cmd.name);

            const isAdminCmd = (cmd as any)?.config?.hasPermssion === 2;

            if (isAdminCmd) {
                adminCommands.push(text);
            } else {
                userCommands.push(text);
            }
        }

        userCommands.sort();
        adminCommands.sort();

        // ===== TIME =====
        const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY");

        const botName = config?.botName || "BOT";

        // ===== MENU BUILD =====
        let menuText =
            `»»»»» ${toBoldText(botName)} «««««\n` +
            `──────────────\n` +
            `📜 ${toBoldText("USER COMMANDS")} (${userCommands.length}):\n` +
            userCommands.join("\n");

        if (isAdmin && adminCommands.length > 0) {
            menuText +=
                `\n\n🛠️ ${toBoldText("ADMIN COMMANDS")} (${adminCommands.length}):\n` + adminCommands.join("\n");
        }

        menuText += `\n──────────────\n` + `» Prefix: ${toBoldText(prefix)}\n` + `» Time: ${time}`;

        // ===== SEND =====
        try {
            await reply(menuText);
        } catch (err) {
            console.error(chalk.red("[MENU ERROR]"), err);
            await reply("❌ Không gửi được menu");
        }
    },
});
