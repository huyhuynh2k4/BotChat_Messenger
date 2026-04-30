import fs from "fs";
import path from "path";

const SERVICE_PATH = path.join(process.cwd(), "data/service.json");

export type ServiceItem = {
    content: string;
    tagname: string;
};

// =====================
export function readService(): ServiceItem[] {
    try {
        if (!fs.existsSync(SERVICE_PATH)) {
            fs.writeFileSync(SERVICE_PATH, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(SERVICE_PATH, "utf8"));
    } catch {
        return [];
    }
}

// =====================
export function saveService(data: ServiceItem[]) {
    fs.writeFileSync(SERVICE_PATH, JSON.stringify(data, null, 2));
}

// =====================
export function formatService(list: ServiceItem[]): string {
    if (!list.length) return "📡 Service trống";

    let msg = "╭──── 📡 SERVICE ────╮\n\n";

    list.forEach((item, i) => {
        msg += `${i + 1}. ${item.content}\n`;
        msg += ` 📞  Liên hệ: @${item.tagname}\n\n`;
    });

    msg += "╰───────────────────╯";

    return msg;
}

const FILTER_PATH = path.join(process.cwd(), "data/servicefilter.json");

// =====================
export function readFilter(): string[] {
    try {
        if (!fs.existsSync(FILTER_PATH)) {
            fs.writeFileSync(FILTER_PATH, JSON.stringify([], null, 2));
            return [];
        }
        return JSON.parse(fs.readFileSync(FILTER_PATH, "utf8"));
    } catch {
        return [];
    }
}

// =====================
export function saveFilter(data: string[]) {
    fs.writeFileSync(FILTER_PATH, JSON.stringify(data, null, 2));
}

// =====================
// 🔥 check keyword
// =====================
function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""); // bỏ dấu
}
export function matchFilter(text: string): boolean {
    const list = readFilter();

    const normText = normalize(text);

    return list.some(k => normText.includes(normalize(k)));
}
