import { Bot } from "@/classes/Bot";
import { formatService, matchFilter, readFilter, readService } from "@/utils/service";

export default Bot.createEvent({
    eventName: "message",

    emit: async (client, message) => {
        const text = message.text;
        if (!text) return;

        // ❌ bỏ bot
        if (String(message.senderId) === String(client.user?.id)) return;

        console.log("📩 MSG:", text);

        // =====================
        // 🔥 CHECK FILTER
        // =====================
        if (!matchFilter(text)) {
            console.log("⏭ NO MATCH");
            return;
        }

        console.log("🔥 MATCH FILTER → SHOW SERVICE");

        const service = readService();

        if (!service.length) {
            console.log("⚠️ SERVICE EMPTY");
            return;
        }

        await client.sendMessage(BigInt(message.threadId), {
            text: formatService(service),
        });
    },
});
