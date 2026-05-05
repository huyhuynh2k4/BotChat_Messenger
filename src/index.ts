import "dotenv/config";
import { Bot } from "@/classes";

const RESTART_DELAY = 5000; // 5s

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

// 🔥 bắt lỗi global (không cho crash process)
process.on("uncaughtException", err => {
    console.error("💥 Uncaught Exception:", err);
});

process.on("unhandledRejection", err => {
    console.error("💥 Unhandled Rejection:", err);
});

async function run() {
    while (true) {
        let bot: Bot | null = null;

        try {
            console.log("🚀 Starting bot...");

            bot = new Bot();

            // 🔥 log cơ bản
            bot.on("fullyReady", () => {
                console.log("✅ Bot fully ready");
            });

            // 🔥 lỗi websocket / lib
            bot.on("error", async (err: Error) => {
                console.error("⚠️ SOCKET ERROR:", err.message);

                // 👉 nếu là lỗi websocket → reconnect
                if (err.message?.includes("websocket")) {
                    console.log("🔄 Reconnecting...");
                    try {
                        await bot?.reconnectSafe();
                    } catch {
                        console.log("❌ Reconnect failed → restart loop");
                        throw err; // cho while(true) restart
                    }
                }
            });

            // 🔥 khi mất kết nối
            (bot as any).on("disconnect", () => {
                console.warn("⚠️ Disconnected");
            });

            (bot as any).on("close", () => {
                console.warn("⚠️ Connection closed");
            });

            await bot.startSafe(); // start có bảo vệ

            // giữ tiến trình sống (đợi event)
            await new Promise<void>((resolve, reject) => {
                // nếu bot chủ động signal chết → reject để restart
                (bot as any).once("__fatal__", (e: Error) => reject(e));
            });
        } catch (err) {
            console.error("💥 Bot crashed:", err);
        }

        console.log(`🔁 Restarting in ${RESTART_DELAY / 1000}s...`);
        await sleep(RESTART_DELAY);
    }
}

run();
