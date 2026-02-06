import { Bot } from "@/classes";
import { logger } from "@/utils/logger";

export default Bot.createEvent({
    eventName: "message",
    emit: (client, message) => {
        if (message.senderId === client.currentUserId) return;
        if (!message.text.startsWith(process.env.BOT_PREFIX)) {
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
                return client.sendMessage(message.threadId, { text: content });
            };

            const reply = (content: string) => {
                return client.sendMessage(message.threadId, {
                    replyToId: message.id,
                    text: content,
                });
            };

            command.run({ client, message, args, send, reply });
        } catch (error) {
            logger.error(`Error executing command ${commandName}`);
            console.error(error);
        }
    },
});
