import crypto from "crypto";
import { OpenAI } from "openai";
import type { EasyInputMessage } from "openai/resources/responses/responses";

import type { Bot } from "@/classes";

export class Agent extends OpenAI {
    private readonly history = new Map<string, string>();

    constructor(public readonly client: Bot) {
        super({ baseURL: process.env.BASE_URL, apiKey: process.env.API_KEY });
    }

    public createSafetyIdentifier(userId: string): string {
        return crypto.createHash("md5").update(userId).digest("hex");
    }

    public async processMessage(userId: string, input: EasyInputMessage[]) {
        const safetyId = this.createSafetyIdentifier(userId);
        const response = await this.responses.create({
            previous_response_id: this.history.get(safetyId),
            prompt_cache_retention: "24h",
            model: process.env.MODEL_NAME,
            safety_identifier: safetyId,
            prompt_cache_key: safetyId,
            truncation: "auto",
            store: true,
            input,
            tools: [
                {
                    type: "web_search",
                },
                {
                    type: "code_interpreter",
                    container: {
                        type: "auto",
                    },
                },
            ],
        });

        this.history.set(safetyId, response.id);

        return response;
    }
}
