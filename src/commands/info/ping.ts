import { Bot } from "@/classes/Bot";
import { checkMessageE2EE } from "@/utils/utils";

export default Bot.createCommand({
    name: "ping",
    aliases: ["p"],
    run: async (client, message, args) => {
        const ping = Date.now() - message.timestampMs;
        const isE2EE = checkMessageE2EE(message);

        if (isE2EE) {
            await client.sendE2EEMessage(message.chatJid, `Pong! 🏓 | Latency: ${ping}ms`);
        } else {
            await client.sendMessage(message.threadId, `Pong! 🏓 | Latency: ${ping}ms`);
        }
    },
});
