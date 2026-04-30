import { Bot } from "@/classes/Bot";
import { checkAdmin } from "@/utils/permission";
import { readService, saveService, formatService, saveFilter, readFilter } from "@/utils/service";

export default Bot.createCommand({
    name: "service",

    run: async ({ args, message, reply }) => {
        const cmd = args[0];
        const list = readService();
        if (!checkAdmin(String(message.senderId))) {
            await reply("⛔ Chỉ ADMIN mới được sử dụng lệnh này.");
            return;
        }
        // =====================
        // 📦 VIEW
        // =====================
        if (!cmd) {
            await reply(formatService(list));
            return;
        }

        // =====================
        // ➕ ADD
        // =====================
        if (cmd === "add") {
            const raw = args.slice(1).join(" ");

            const mention = message.mentions?.[0];

            if (!mention) {
                await reply("⚠️ Phải tag user");
                return;
            }

            const tagId = String(mention.userId);

            // 🔥 tách theo dấu @
            const parts = raw.split("@");

            const content = parts[0].trim(); // trước @
            const tagname = parts[1]?.trim() || ""; // sau @ (full name)

            if (!content || !tagname) {
                await reply("⚠️ Sai format");
                return;
            }

            list.push({
                content,
                tagname,
            });

            saveService(list);

            await reply(`✅ Added:\n${content}\n👤 ${tagname}`);
            return;
        }

        // =====================
        // ❌ REMOVE
        // =====================
        if (cmd === "remove") {
            const sub = args[1];

            // =====================
            // ❌ REMOVE ALL
            // =====================
            if (sub === "all") {
                if (list.length === 0) {
                    await reply("⚠️ Service đã trống");
                    return;
                }

                saveService([]);

                await reply("🗑 Đã xoá toàn bộ service");
                return;
            }

            // =====================
            // ❌ REMOVE INDEX
            // =====================
            const index = Number(sub) - 1;

            if (isNaN(index) || index < 0 || index >= list.length) {
                await reply("⚠️ Index không hợp lệ");
                return;
            }

            const removed = list.splice(index, 1);

            saveService(list);

            await reply(`🗑 Removed:\n${removed[0].content}`);
            return;
        }

        if (cmd === "filter") {
            const action = args[1];
            const keyword = args.slice(2).join(" ").toLowerCase();

            let list = readFilter();

            // =====================
            // ➕ ADD
            // =====================
            if (action === "add") {
                if (!keyword) {
                    await reply("⚠️ Dùng: shop filter add <keyword>");
                    return;
                }

                if (list.includes(keyword)) {
                    await reply("⚠️ Đã tồn tại");
                    return;
                }

                list.push(keyword);
                saveFilter(list);

                await reply(`✅ Added filter: ${keyword}`);
                return;
            }

            // =====================
            // ❌ REMOVE ALL
            // =====================
            if (action === "remove" && args[2] === "all") {
                if (list.length === 0) {
                    await reply("⚠️ Filter trống");
                    return;
                }

                saveFilter([]);

                await reply("🗑 Đã xoá toàn bộ filter");
                return;
            }

            // =====================
            // ❌ REMOVE 1
            // =====================
            if (action === "remove") {
                if (!keyword) {
                    await reply("⚠️ Dùng: shop filter remove <keyword>");
                    return;
                }

                if (!list.includes(keyword)) {
                    await reply("⚠️ Không tồn tại");
                    return;
                }

                list = list.filter(x => x !== keyword);
                saveFilter(list);

                await reply(`🗑 Removed filter: ${keyword}`);
                return;
            }

            // =====================
            // 📦 VIEW
            // =====================
            if (!action) {
                if (!list.length) {
                    await reply("📂 Filter trống");
                    return;
                }

                let msg = "📂 FILTER:\n\n";

                list.forEach((k, i) => {
                    msg += `${i + 1}. ${k}\n`;
                });

                await reply(msg);
                return;
            }
        }
    },
});
