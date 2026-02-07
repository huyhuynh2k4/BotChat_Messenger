import { Bot } from "@/classes";
import { logger } from "@/utils/logger";

export default Bot.createEvent({
    eventName: "e2eeMessage",
    emit: async (client, message) => {
        if (message.senderId.toString() === client.currentUserId.toString()) return;
        if (!message.text.startsWith(process.env.BOT_PREFIX)) {
            if (!message.mentions?.some(m => m.userId.toString() === client.currentUserId.toString())) return;
            const response = await client.agent.processMessage(message.senderId.toString(), message.text, message);

            console.log(response);

            return;
        }

        const input = message.text.slice(process.env.BOT_PREFIX.length);
        const args = input.trim().split(/\s+/g);

        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            const send = (content: string) => {
                return client.sendE2EEMessage(message.chatJid, content);
            };

            const reply = (content: string) => {
                return client.sendE2EEMessage(message.chatJid, content, {
                    replyToSenderJid: message.senderJid,
                    replyToId: message.id,
                });
            };

            command.run({ client, message, args, send, reply });
        } catch (error) {
            logger.error(`Error executing command ${commandName}`);
            console.error(error);
        }
    },
});
