import { Bot } from "@/classes/Bot";

export default Bot.createCommand({
    name: "ping",
    aliases: ["p"],
    run: async ({ client, message, reply }) => {
        const ping = Date.now() - Number(message.timestampMs);

        reply(`Pong! 🏓 | Latency: ${ping}ms`);
    },
});
