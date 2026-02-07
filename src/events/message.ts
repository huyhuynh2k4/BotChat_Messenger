import { Bot } from "@/classes";
import { logger } from "@/utils/logger";

export default Bot.createEvent({
    eventName: "message",
    emit: async (client, message) => {
        if (message.senderId.toString() === client.currentUserId.toString()) return;
        if (!message.text.startsWith(process.env.BOT_PREFIX)) {
            if (!message.mentions?.some(m => m.userId.toString() === client.currentUserId.toString())) return;
            if (!message.text.startsWith(`@${client.user.name}`)) return;

            const content = message.text.replace(`@${client.user.name}`, "").trim();

            try {
                const response = await client.agent.processMessage(message.senderId.toString(), content, message);
                console.log(response);
            } catch (error) {
                logger.error(`Error processing message from ${message.senderId}: ${message.text}`);
                console.error(error);
                logger.debug(message);
            }

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
