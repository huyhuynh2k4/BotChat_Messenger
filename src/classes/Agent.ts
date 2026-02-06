import { OpenAI } from "openai";

import type { Bot } from "./Bot";

export class Agent extends OpenAI {
    private readonly history = new Map<string, OpenAI.Chat.Completions.ChatCompletionMessageParam[]>();
    private readonly MAX_COMPLETION_TOKENS = 4096;

    constructor(public readonly client: Bot) {
        super({
            baseURL: process.env.BASE_URL,
            apiKey: process.env.API_KEY,
        });
    }

    public async createCompletion(threadId: string, prompt: string) {
        const history = this.history.get(threadId) || [];

        const response = this.chat.completions.create({
            model: process.env.MODEL_NAME,
            max_completion_tokens: this.MAX_COMPLETION_TOKENS,
            messages: [...history, { role: "user", content: prompt }],
        });

        response.then(res => {
            const assistantMessage = res.choices[0].message;
            history.push({ role: "user", content: prompt });
            history.push({ role: "assistant", content: assistantMessage.content });
        });
    }
}
