import fs from "fs";
import { Client, type ClientEventMap, Utils } from "meta-messenger.js";
import path from "path";

import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

type CreateEventProps<T extends keyof ClientEventMap = keyof ClientEventMap> = {
    eventName: T;
    once?: boolean;
    emit: (client: Client, ...args: ClientEventMap[T]) => void;
};

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

    public async initializeEvents() {
        const eventsPath = path.join(process.cwd(), "src/events");
        const eventFiles = fs.readdirSync(eventsPath);
        let count = 0;

        for (const file of eventFiles) {
            if (!file.endsWith(".ts")) continue;

            const eventFile = path.join(eventsPath, file);
            const event = await importDefault<CreateEventProps>(eventFile);
            if (!event) continue;

            if (event.once) {
                this.once(event.eventName, (...args) => {
                    event.emit(this, ...args);
                });
            } else {
                this.on(event.eventName, (...args) => {
                    event.emit(this, ...args);
                });
            }

            count++;
        }

        logger.debug(`> Loaded ${count} event(s)!`);
    }

    public start() {
        this.once("fullyReady", () => {
            logger.debug("> Client is fully ready!");
        });

        this.connect().then(({ user }) => {
            logger.debug(`> Logged in as ${user.name} (ID: ${user.id})`);
            logger.debug("> Please wait until bot is fully ready...");

            this.initializeEvents();
        });
    }
}
