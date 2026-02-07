import fs from "fs";
import type { ClientEventMap } from "meta-messenger.js";
import path from "path";

import type { Bot } from "@/classes";
import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

export type CreateEventProps<T extends keyof ClientEventMap = keyof ClientEventMap> = {
    eventName: T;
    once?: boolean;
    emit: (client: Bot<true>, ...args: ClientEventMap[T]) => void;
};

export default async (client: Bot) => {
    const eventsPath = path.join(process.cwd(), "src/events");
    const eventFiles = fs.readdirSync(eventsPath);
    let count = 0;

    for (const file of eventFiles) {
        if (!file.endsWith(".ts")) continue;

        const eventFile = path.join(eventsPath, file);
        const event = await importDefault<CreateEventProps>(eventFile);
        if (!event) continue;

        if (event.once) {
            client.once(event.eventName, (...args) => {
                event.emit(client, ...args);
            });
        } else {
            client.on(event.eventName, (...args) => {
                event.emit(client, ...args);
            });
        }

        count++;
    }

    logger.debug(`> Loaded ${count} event(s).`);
};
