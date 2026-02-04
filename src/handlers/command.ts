import fs from "fs";
import type { E2EEMessage, Message } from "meta-messenger.js";
import path from "path";

import type { Bot } from "@/classes";
import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

type CommandParams = {
    client: Bot<true>;
    message: Message | E2EEMessage;
    args: string[];
};

export type CommandProps = {
    name: string;
    aliases?: string[];
    run: (params: CommandParams) => Promise<void> | void;
};

export default async (client: Bot) => {
    const commandsPath = path.join(process.cwd(), "src/commands");
    const commandFiles = fs.readdirSync(commandsPath);
    let count = 0;

    for (const category of commandFiles) {
        const filePath = path.join(commandsPath, category);

        for (const cmd of fs.readdirSync(filePath)) {
            if (!cmd.endsWith(".ts")) continue;

            const commandFile = path.join(filePath, cmd);
            const command = await importDefault<CommandProps>(commandFile);
            if (!command) continue;

            client.commands.set(command.name, command);
            count++;

            if (command.aliases && command.aliases.length > 0) {
                for (const alias of command.aliases) {
                    client.aliases.set(alias, command.name);
                }
            }

            const cmds = client.categories.get(category) || [command.name];
            client.categories.set(category, [...cmds, command.name]);
        }
    }

    logger.debug(`> Loaded ${count} command(s).`);
};
