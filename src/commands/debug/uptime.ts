import { Bot } from "@/classes/Bot";
import { checkMessageE2EE } from "@/utils/utils";

export default Bot.createCommand({
    name: "uptime",
    aliases: ["u"],
    run: async ({ client, message }) => {
        let totalSeconds = client.uptime / 1000;

        const days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;

        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);

        const content = `🤖 Uptime: **${days}d ${hours}h ${minutes}m ${seconds}s**`;

        if (checkMessageE2EE(message)) {
            client.sendE2EEMessage(message.chatJid, content, {
                replyToSenderJid: message.senderJid,
                replyToId: message.id.toString(),
            });
        } else {
            client.sendMessage(message.threadId, {
                replyToId: message.id.toString(),
                text: content,
            });
        }
    },
});
