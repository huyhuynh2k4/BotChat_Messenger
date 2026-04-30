import { getUser, getTop } from "@/events/exp_user";
import { Bot } from "@/classes";

// =====================
function getNeedExp(level: number) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

function getRank(level: number) {
    if (level < 10) return "🥉 Bronze";
    if (level < 20) return "🥈 Silver";
    if (level < 30) return "🥇 Gold";
    if (level < 50) return "💎 Diamond";
    return "🔥 Immortal";
}

function getBar(exp: number, need: number) {
    const size = 10;
    const percent = exp / need;

    const filled = Math.round(percent * size);
    return "█".repeat(filled) + "░".repeat(size - filled);
}

// =====================
export default Bot.createCommand({
    name: "exp",

    run: async ({ message, args, reply }) => {
        const senderID = String(message.senderId);
        const sub = args[0]?.toLowerCase();

        // =====================
        // 📊 PROFILE (SELF)
        // =====================
        if (!sub) {
            const user = getUser(senderID);
            const need = getNeedExp(user.level);

            await reply(
                `╭─── 🎮 EXP PROFILE ───╮\n` +
                    `👤 Name: ${user.name || "Unknown"}\n` +
                    `🏅 Level: ${user.level}\n` +
                    `🏆 Rank: ${getRank(user.level)}\n\n` +
                    `📊 EXP: ${user.exp}/${need}\n` +
                    `🔋 ${getBar(user.exp, need)}\n\n` +
                    `🔥 Total: ${user.total}\n` +
                    `╰────────────────────╯`,
            );
            return;
        }

        // =====================
        // 🏆 TOP
        // =====================
        if (sub === "top") {
            const top = getTop(10);

            let msg = "╭── 🏆 TOP EXP ──╮\n\n";

            top.forEach(([id, data]: any, i) => {
                msg += `${i + 1}. ${data.name || "Unknown"}\n`;
                msg += `   Lv.${data.level} | ${data.total} EXP\n\n`;
            });

            msg += "╰──────────────╯";

            await reply(msg);
            return;
        }

        // =====================
        // 👤 USER KHÁC
        // =====================
        const targetID = String(message.mentions?.[0]?.userId || sub);

        const user = getUser(targetID);
        const need = getNeedExp(user.level);

        await reply(
            `╭── 👤 USER PROFILE ──╮\n` +
                `Name: ${user.name || "Unknown"}\n` +
                `🏅 Level: ${user.level}\n` +
                `🏆 Rank: ${getRank(user.level)}\n\n` +
                `📊 EXP: ${user.exp}/${need}\n` +
                `🔋 ${getBar(user.exp, need)}\n\n` +
                `🔥 Total: ${user.total}\n` +
                `╰────────────────────╯`,
        );
    },
});
