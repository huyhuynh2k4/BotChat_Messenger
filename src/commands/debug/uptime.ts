import { Bot } from "@/classes/Bot";
/*
export default Bot.createCommand({
    name: "uptime",
    aliases: ["u"],
    run: async ({ client, reply }) => {
        let totalSeconds = client.uptime / 1000;

        const days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;

        const hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;

        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);

        reply(`🤖 Uptime: **${days}d ${hours}h ${minutes}m ${seconds}s**`);
    },
});

*/
