import axios from "axios";
import type { ResponseInputMessageContentList } from "openai/resources/responses/responses";

import { Bot } from "@/classes";
import { logger } from "@/utils/logger";

export default Bot.createEvent({
    eventName: "message",
    emit: async (client, message) => {
        if (message.senderId.toString() === client.currentUserId.toString()) return;
        if (!message.text.startsWith(process.env.BOT_PREFIX)) {
            if (!message.mentions?.some(m => m.userId.toString() === client.currentUserId.toString())) return;
            if (!message.text.startsWith(`@${client.user.name}`)) return;

            const messageContent = message.text.replace(`@${client.user.name}`, "").trim();

            try {
                const content: ResponseInputMessageContentList = [];

                if (messageContent.length > 0) {
                    content.push({ type: "input_text", text: messageContent });
                }

                if (message.attachments && message.attachments.length > 0) {
                    for (const attachment of message.attachments) {
                        if (attachment.type !== "image") continue;

                        const imageData = await axios({
                            responseType: "arraybuffer",
                            url: attachment.url,
                            method: "get",
                        });

                        const base64Image = Buffer.from(imageData.data).toString("base64");

                        content.push({
                            image_url: `data:${attachment.mimeType};base64,${base64Image}`,
                            type: "input_image",
                            detail: "auto",
                        });
                    }
                }

                if (content.length === 0) {
                    logger.error("No content to process for message");
                    return logger.debug(message);
                }

                await client.sendTypingIndicator(message.threadId, true, true);

                const msg = await client.sendMessage(message.threadId, {
                    text: "⏰ | Chờ một chút nhé...",
                    replyToId: message.id,
                });

                await client.sendTypingIndicator(message.threadId, false, true);

                const response = await client.agent.processMessage(message.senderId.toString(), [
                    { role: "user", content, type: "message" },
                ]);

                await client.editMessage(msg.messageId, response.output_text);
            } catch (error) {
                logger.error(`Error processing message from ${message.senderId}: ${messageContent}`);
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
