import { OpenAI } from "openai";

import type { Bot } from "./Bot";

export class Agent extends OpenAI {
    constructor(public readonly client: Bot) {
        super({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.BASE_URL,
        });
    }
}
