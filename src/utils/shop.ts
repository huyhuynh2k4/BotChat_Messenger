import fs from "fs";
import path from "path";

const SHOP_PATH = path.join(process.cwd(), "data/shopadmin.json");

export type ShopItem = {
    name: string;
    price: string; // 🔥 string
};

// =====================
export function readShop(): ShopItem[] {
    try {
        if (!fs.existsSync(SHOP_PATH)) {
            fs.writeFileSync(SHOP_PATH, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(SHOP_PATH, "utf8"));
    } catch {
        return [];
    }
}

// =====================
export function saveShop(data: ShopItem[]) {
    fs.writeFileSync(SHOP_PATH, JSON.stringify(data, null, 2));
}

// =====================
export function formatShopTable(list: ShopItem[]): string {
    if (!list.length) return "🛒 Shop trống";

    let msg = "╭──── 🛒 SHOP ────╮\n\n";

    list.forEach((item, i) => {
        msg += `${i + 1}. ${item.name}\n`;
        msg += `   💰 ${item.price}\n\n`;
    });

    msg += "╰─────────────────╯";

    return msg;
}
