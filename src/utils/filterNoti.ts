export class FilterNoti {
    private static instance: FilterNoti;

    public readonly CATEGORY_MAP: Record<string, string[]> = {
        BOSS: ["boss", "tieu diet"],
        REWARD: ["may man", "cai trang"],
        UPGRADE: ["nang cap"],
        CRYSTALLIZATION: ["pha le", "chuc mung"],
        DIVINE_ITEMS: ["do than linh", "than linh"],
        SYSTEM: ["vua danh quai"],
        OTHER: ["nhat duoc", "vua len top"],
    };

    private constructor() {}

    public static getInstance(): FilterNoti {
        if (!FilterNoti.instance) {
            FilterNoti.instance = new FilterNoti();
        }
        return FilterNoti.instance;
    }

    public detectCategory(text: string): string {
        const normalized = toAscii(text); // 🔥 FIX

        for (const cat in this.CATEGORY_MAP) {
            const keywords = this.CATEGORY_MAP[cat];

            for (const k of keywords) {
                const key = toAscii(k); // 🔥 FIX

                if (normalized.includes(key)) {
                    return cat;
                }
            }
        }

        return "OTHER";
    }
}

//---------- Filter Keyword -----------
import fs from "fs";
import path from "path";

const FILTER_PATH = path.join(process.cwd(), "data/filter.json");

// =====================
function readFilter(): string[] {
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
// 🔥 HÀM CHECK
function toAscii(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\w\s+]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

export function checkFilter(text: string): boolean {
    const keywords = readFilter();

    if (!text || keywords.length === 0) return false;

    const lowerText = " " + toAscii(text) + " ";

    for (const k of keywords) {
        const key = toAscii(k);

        if (!key.trim()) continue;

        const target = " " + key + " ";

        if (lowerText.includes(target)) {
            console.log("MATCH:", key);
            return true;
        }
    }

    return false;
}
