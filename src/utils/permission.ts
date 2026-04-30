import fs from "fs";
import path from "path";

const ADMIN_FILE = path.join(process.cwd(), "data/admin.json");
const BOX_SETTINGS_PATH = path.join(process.cwd(), "data/boxsetting.json");
function readJSON(file: string, defaultValue: any = {}) {
    try {
        if (!fs.existsSync(file)) return defaultValue;
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return defaultValue;
    }
}

export function getAdminData() {
    return readJSON(ADMIN_FILE, { owners: [], admins: [] });
}

export function isOwner(senderID: string) {
    const data = getAdminData();
    return data.owners.includes(senderID);
}

export function isAdmin(senderID: string) {
    const data = getAdminData();
    return data.admins.includes(senderID);
}

export function checkAdmin(senderID: string) {
    return isOwner(senderID) || isAdmin(senderID);
}
// =====================
export function checkBox(threadId: string): boolean {
    const config = readJSON(BOX_SETTINGS_PATH, {});

    if (!config.boxID) {
        console.log("❌ NO BOX ID IN CONFIG");
        return false;
    }

    const result = String(threadId) === String(config.id);

    return result;
}
