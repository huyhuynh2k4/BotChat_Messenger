import fs from "fs";
import type { E2EEMessage, Message, SendMessageResult } from "meta-messenger.js";
import path from "path";

import type { Bot } from "@/classes";
import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

// =====================
// TYPES
// =====================
type CommandParams = {
    client: Bot<true>;
    message: Message | E2EEMessage;
    args: string[];

    send: (content: string) => Promise<SendMessageResult>;

    reply: (content: string) => Promise<SendMessageResult>;
};

export type CommandProps = {
    name: string;
    aliases?: string[];

    run: (params: CommandParams) => Promise<void> | void;
};

// =====================
// GLOBAL REPLY QUEUE
// =====================
const replyQueue: (() => Promise<void>)[] = [];

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================
// WORKER
// =====================
setInterval(async () => {
    if (replyQueue.length <= 0) return;

    const job = replyQueue.shift();

    if (!job) return;

    try {
        await job();
    } catch (err) {
        console.error("❌ Reply Queue Error:", err);
    }
}, 1500); // 🔥 delay global giữa các message

// =====================
// MAIN
// =====================
export default async (client: Bot) => {
    const commandsPath = path.join(process.cwd(), "src/commands");
    const commandFiles = fs.readdirSync(commandsPath);

    let count = 0;

    // =====================
    // LOAD COMMANDS
    // =====================
    for (const category of commandFiles) {
        const filePath = path.join(commandsPath, category);

        if (!fs.statSync(filePath).isDirectory()) continue;

        for (const cmd of fs.readdirSync(filePath)) {
            if (!cmd.endsWith(".ts")) continue;

            const commandFile = path.join(filePath, cmd);

            const command = await importDefault<CommandProps>(commandFile);

            if (!command) continue;

            // =====================
            // REGISTER
            // =====================
            client.commands.set(command.name, command);

            count++;

            // =====================
            // ALIASES
            // =====================
            if (command.aliases?.length) {
                for (const alias of command.aliases) {
                    client.aliases.set(alias, command.name);
                }
            }

            // =====================
            // CATEGORY
            // =====================
            const cmds = client.categories.get(category) || [];

            client.categories.set(category, [...cmds, command.name]);
        }
    }

    logger.debug(`> Loaded ${count} command(s).`);

    // =====================
    // SAFE REPLY WRAPPER
    // =====================
    client.on("message", async (message: Message | E2EEMessage) => {
        try {
            const body = (message as any).body || "";

            if (!body) return;

            const prefix = "!";

            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/\s+/);

            const commandName = args.shift()?.toLowerCase();

            if (!commandName) return;

            // =====================
            // FIND COMMAND
            // =====================
            const realName = client.aliases.get(commandName) || commandName;

            const command = client.commands.get(realName);

            if (!command) return;

            // =====================
            // ORIGINAL SEND
            // =====================
            const originalReply = async (content: string) => {
                return await (message as any).reply(content);
            };

            const originalSend = async (content: string) => {
                return await client.sendMessage((message as any).threadID || (message as any).threadId, content);
            };

            // =====================
            // SAFE REPLY
            // =====================
            const safeReply = async (content: string): Promise<SendMessageResult> => {
                return new Promise((resolve, reject) => {
                    replyQueue.push(async () => {
                        try {
                            // 🔥 random delay
                            const delay = Math.floor(Math.random() * 2000) + 1000;

                            await sleep(delay);

                            logger.debug(`📨 REPLY: ${content}`);

                            const result = await originalReply(content);

                            resolve(result);
                        } catch (err) {
                            console.error("❌ Reply Error:", err);

                            reject(err);
                        }
                    });
                });
            };

            // =====================
            // SAFE SEND
            // =====================
            const safeSend = async (content: string): Promise<SendMessageResult> => {
                return new Promise((resolve, reject) => {
                    replyQueue.push(async () => {
                        try {
                            const delay = Math.floor(Math.random() * 2000) + 1000;

                            await sleep(delay);

                            logger.debug(`📤 SEND: ${content}`);

                            const result = await originalSend(content);

                            resolve(result);
                        } catch (err) {
                            console.error("❌ Send Error:", err);

                            reject(err);
                        }
                    });
                });
            };

            // =====================
            // RUN COMMAND
            // =====================
            await command.run({
                client: client as Bot<true>,
                message,
                args,

                send: safeSend,
                reply: safeReply,
            });
        } catch (err) {
            console.error("❌ Command Handler Error:", err);
        }
    });
};
