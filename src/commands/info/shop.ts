import { Bot } from "@/classes/Bot";
import { checkAdmin } from "@/utils/permission";
import { formatShopTable, readShop, saveShop } from "@/utils/shop";

export default Bot.createCommand({
    name: "shop",

    run: async ({ args, message, reply }) => {
        const cmd = args[0];
        const shop = readShop();
        if (!checkAdmin(String(message.senderId))) {
            await reply("⛔ Chỉ ADMIN mới được sử dụng lệnh này.");
            return;
        }
        if (!cmd) {
            let msg = "📦 SERVICE COMMAND:\n\n";

            msg += "➤ !service check\n";
            msg += "➤ !service add <content> @tag\n";
            msg += "➤ !service remove <index>\n";
            msg += "➤ !service remove all\n";
            msg += "➤ !service filter\n";
            msg += "➤ !service filter add <keyword>\n";
            msg += "➤ !service filter remove <keyword>\n";
            msg += "➤ !service filter remove all\n\n";

            msg += "📂 CURRENT SERVICE:\n";

            await reply(msg);
            return;
        }
        if (cmd == "check") {
            await reply(formatShopTable(shop));
            return;
        }
        if (cmd === "add") {
            const raw = args.slice(1).join(" ");

            if (!raw) {
                await reply("⚠️ Dùng: shop add <name> <price>");
                return;
            }

            const { name, price } = extractNameAndPrice(raw);

            if (!name || !price) {
                await reply("⚠️ Sai format\nVD: shop add kiếm thần 200k");
                return;
            }

            shop.push({ name, price });

            saveShop(shop);

            await reply(`✅ Added:\n📦 ${name}\n💰 ${price}`);
            return;
        }
        if (cmd === "remove") {
            const sub = args[1];

            // =====================
            // ❌ REMOVE ALL
            // =====================
            if (sub === "all") {
                if (shop.length === 0) {
                    await reply("⚠️ Shop đã trống");
                    return;
                }

                saveShop([]); // 🔥 clear file

                await reply("🗑 Đã xoá toàn bộ shop");
                return;
            }

            // =====================
            // ❌ REMOVE INDEX
            // =====================
            const index = Number(sub) - 1;

            if (isNaN(index) || index < 0 || index >= shop.length) {
                await reply("⚠️ Index không hợp lệ");
                return;
            }

            const removed = shop.splice(index, 1);

            saveShop(shop);

            await reply(`🗑 Removed: ${removed[0].name}`);
            return;
        }
    },
});

function extractNameAndPrice(input: string) {
    const parts = input.trim().split(" ").filter(Boolean);

    let price = parts.pop();

    if (!price) return { name: "", price: "" };

    // nếu có VND
    if (price.toLowerCase() === "vnd") {
        const prev = parts.pop();
        if (!prev) return { name: "", price: "" };
        price = prev + " VND";
    }

    const name = parts.join(" ").trim();

    return { name, price };
}
