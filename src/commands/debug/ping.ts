import { Bot } from "@/classes/Bot";

export default Bot.createCommand({
    name: "bot",
    run: async ({ args, message, reply }) => {
        const cmd = args?.[0];

        switch (cmd) {
            case "hello":
                return reply("Hello Huy Huynh dz , con re rach kko wy zo chuong👋");

            case "ping":
                return reply(`🏓 Pong ${Date.now() - Number(message.timestampMs)}ms`);

            case "time":
                return reply(`🕒 ${new Date().toLocaleString()}`);

            default:
                return reply("Commands:\n" + "- bot hello\n" + "- bot ping\n" + "- bot time");
        }
    },
});
