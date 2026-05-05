export class FilterNoti {
    private static instance: FilterNoti;

    public readonly CATEGORY_MAP: Record<string, string[]> = {
        BOSS: ["boss", "tiêu diệt"],
        REWARD: ["may mắn"],
        UPGRADE: ["nâng cấp"],
        CRYSTALLIZATION: ["pha lê", "chúc mừng"],
        DIVINE_ITEMS: ["đồ thần linh", "thần linh"],
        SYSTEM: ["vừa đánh quái"],
        OTHER: ["nhặt được", "vừa lên top"],
    };

    private constructor() {}

    public static getInstance(): FilterNoti {
        if (!FilterNoti.instance) {
            FilterNoti.instance = new FilterNoti();
        }
        return FilterNoti.instance;
    }

    public detectCategory(text: string): string {
        const lower = text.toLowerCase();

        for (const cat in this.CATEGORY_MAP) {
            const keywords = this.CATEGORY_MAP[cat];

            for (const k of keywords) {
                if (lower.includes(k)) {
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
        .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
        .toLowerCase()
        .replace(/[^\w\s]/g, " ") // 🔥 THÊM DÒNG NÀY (xoá . , :)
        .replace(/\s+/g, " ")
        .trim();
}
export function checkFilter(text: string): boolean {
    const keywords = readFilter();
    if (!text || keywords.length === 0) return false;

    const lowerText = " " + toAscii(text) + " ";

    for (const k of keywords) {
        const key = toAscii(k);

        if (!key || key.length < 2) continue;

        const target = " " + key + " ";

        if (lowerText.includes(target)) {
            console.log("MATCH:", key);
            return true;
        }
    }

    return false;
}
