import type { ResponseInputMessageContentList } from "openai/resources/responses/responses";

import { Bot } from "@/classes";
import { logger } from "@/utils/logger";

export default Bot.createEvent({
    eventName: "e2eeMessage",
    emit: async (client, message) => {
        if (message.senderId.toString() === client.currentUserId.toString()) return;
        if (!message.text.startsWith(process.env.BOT_PREFIX)) {
            try {
                const content: ResponseInputMessageContentList = [];

                if (message.text.length > 0) {
                    content.push({ type: "input_text", text: message.text });
                }

                if (message.attachments && message.attachments.length > 0) {
                    for (const attachment of message.attachments) {
                        if (attachment.type !== "image") continue;

                        const image = await client.downloadE2EEMedia({
                            directPath: attachment.directPath!,
                            mediaKey: attachment.mediaKey!,
                            mediaSha256: attachment.mediaSha256!,
                            mediaEncSha256: attachment.mediaEncSha256,
                            mediaType: attachment.type,
                            mimeType: attachment.mimeType!,
                            fileSize: attachment.fileSize!,
                        });

                        const base64Image = Buffer.from(image.data).toString("base64");

                        content.push({
                            image_url: `data:${image.mimeType};base64,${base64Image}`,
                            type: "input_image",
                            detail: "auto",
                        });
                    }
                }

                if (content.length === 0) {
                    logger.error("No content to process for E2EE message");
                    return logger.debug(message);
                }

                await client.sendE2EETyping(message.chatJid, true);

                const msg = await client.sendE2EEMessage(message.chatJid, "⏰ | Chờ một chút nhé...", {
                    replyToSenderJid: message.senderJid,
                    replyToId: message.id,
                });

                await client.sendE2EETyping(message.chatJid, false);

                const response = await client.agent.processMessage(message.senderId.toString(), [
                    { role: "user", content, type: "message" },
                ]);

                await client.editE2EEMessage(message.chatJid, msg.messageId, response.output_text);
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
