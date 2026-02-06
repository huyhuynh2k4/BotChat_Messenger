import crypto from "crypto";
import type { BaseMessage } from "meta-messenger.js";
import { OpenAI } from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";

import type { Bot } from "./Bot";

export class Agent extends OpenAI {
    constructor(public readonly client: Bot) {
        super({
            baseURL: process.env.BASE_URL,
            apiKey: process.env.API_KEY,
        });
    }

    public createSafetyIdentifier(userId: string): string {
        return crypto.createHash("md5").update(userId).digest("hex");
    }

    public async createCompletion(
        userId: string,
        message: BaseMessage,
        input: ResponseInput,
        abortController: AbortController,
    ) {
        this.responses.create(
            {
                safety_identifier: this.createSafetyIdentifier(userId),
                model: process.env.MODEL_NAME,
                truncation: "auto",
                stream: true,
                input,
            },
            {
                signal: abortController.signal,
            },
        );
    }
}
