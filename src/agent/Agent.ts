import crypto from "crypto";
import type { E2EEMessage, Message } from "meta-messenger.js";
import { OpenAI } from "openai";
import type { EasyInputMessage, ResponseInputMessageContentList } from "openai/resources/responses/responses";

import type { Bot } from "@/classes";

export class Agent extends OpenAI {
    private readonly history = new Map<string, string>();

    constructor(public readonly client: Bot) {
        super({
            baseURL: process.env.BASE_URL,
            apiKey: process.env.API_KEY,
        });
    }

    public createSafetyIdentifier(userId: string): string {
        return crypto.createHash("md5").update(userId).digest("hex");
    }

    public processInput(msg: string, message: Message | E2EEMessage): ResponseInputMessageContentList {
        const content: ResponseInputMessageContentList = [{ type: "input_text", text: msg }];

        if (message.attachments) {
            const images = message.attachments.filter(a => a.mimeType?.startsWith("image/"));

            for (const attachment of images) {
                content.push({
                    image_url: attachment.url,
                    type: "input_image",
                    detail: "auto",
                });
            }
        }

        return content;
    }

    public async processMessage(userId: string, msg: string, message: Message | E2EEMessage) {
        const safetyId = this.createSafetyIdentifier(userId);
        const response = await this.responses.create({
            input: this.processInput(msg, message) as unknown as EasyInputMessage[],
            previous_response_id: this.history.get(safetyId),
            prompt_cache_retention: "24h",
            model: process.env.MODEL_NAME,
            safety_identifier: safetyId,
            prompt_cache_key: safetyId,
            truncation: "auto",
            store: true,
        });

        this.history.set(safetyId, response.id);

        return response;
    }
}
