import fs from "fs";
import { Client, type ClientEventMap, Utils } from "meta-messenger.js";
import path from "path";

import type { CreateEventProps } from "@/handlers/event";
import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

export class Bot extends Client {
    constructor() {
        const cookieFilePath = path.join(process.cwd(), process.env.COOKIE_FILE_PATH);
        if (!fs.existsSync(cookieFilePath)) {
            throw new Error(`Cookie file not found at "${cookieFilePath}"`);
        }

        const cookiesString = fs.readFileSync(cookieFilePath, "utf-8");
        const cookies = Utils.parseCookies(JSON.parse(cookiesString));

        super(cookies);
    }

    public static createEvent<T extends keyof ClientEventMap>(props: CreateEventProps<T>) {
        return props;
    }

    public async initializeHandlers() {
        const handlersPath = path.join(process.cwd(), "src/handlers");
        const handlerFiles = fs.readdirSync(handlersPath);

        for (const file of handlerFiles) {
            if (!file.endsWith(".ts")) continue;

            const handlerFile = path.join(handlersPath, file);
            const handler = await importDefault<(bot: Bot) => Promise<void>>(handlerFile);
            if (!handler) continue;

            await handler(this);
        }
    }

    public start() {
        this.once("fullyReady", () => {
            logger.debug("> Client is fully ready!");
        });

        this.connect().then(({ user }) => {
            logger.debug(`> Logged in as ${user.name} (ID: ${user.id})`);
            logger.debug("> Please wait until bot is fully ready...");

            this.initializeHandlers();
        });
    }
}
