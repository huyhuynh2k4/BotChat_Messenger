import { Bot } from "@/classes/Bot";
import { checkMessageE2EE } from "@/utils/utils";

export default Bot.createCommand({
    name: "ping",
    aliases: ["p"],
    run: async ({ client, message }) => {
        const ping = Date.now() - Number(message.timestampMs);
        const isE2EE = checkMessageE2EE(message);

        const content = `Pong! 🏓 | Latency: ${ping}ms`;

        if (isE2EE) {
            await client.sendE2EEMessage(message.chatJid, content, {
                replyToSenderJid: message.senderJid,
                replyToId: message.id.toString(),
            });
        } else {
            await client.sendMessage(message.threadId, {
                replyToId: message.id.toString(),
                text: content,
            });
        }
    },
});
