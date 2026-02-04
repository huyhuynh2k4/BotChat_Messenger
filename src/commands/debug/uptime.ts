import { Bot } from "@/classes/Bot";
import { checkMessageE2EE } from "@/utils/utils";

export default Bot.createCommand({
    name: "uptime",
    aliases: ["u"],
    run: async ({ client, message }) => {
        const uptime = Date.now() - client.readyTimestamp;

        const content = `🤖 Uptime: **${Math.floor(uptime / 1000)} seconds**`;

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
