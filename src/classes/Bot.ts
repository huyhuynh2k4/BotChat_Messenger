import fs from "fs";
import { Client, type ClientEventMap, type If, type User, Utils } from "meta-messenger.js";
import path from "path";

import { Agent } from "@/agent";
import type { CommandProps } from "@/handlers/command";
import type { CreateEventProps } from "@/handlers/event";
import { importDefault } from "@/utils/import";
import { logger } from "@/utils/logger";

export class Bot<Ready extends boolean = boolean> extends Client<Ready> {
    public commands: Map<string, CommandProps> = new Map();
    public categories: Map<string, string[]> = new Map();
    public aliases: Map<string, string> = new Map();

    public agent = new Agent(this);

    #readyAt: If<Ready, Date> = null as If<Ready, Date>;
    #user: If<Ready, User> = null as If<Ready, User>;

    constructor() {
        const cookieFilePath = path.join(process.cwd(), process.env.COOKIE_FILE_PATH);
        if (!fs.existsSync(cookieFilePath)) {
            throw new Error(`Cookie file not found at "${cookieFilePath}"`);
        }

        const cookiesString = fs.readFileSync(cookieFilePath, "utf-8");
        const cookies = Utils.parseCookies(JSON.parse(cookiesString));

        super(cookies);
    }

    public get readyAt(): If<Ready, Date> {
        return this.#readyAt;
    }

    public get readyTimestamp(): If<Ready, number> {
        return (this.#readyAt ? this.#readyAt.getTime() : null) as If<Ready, number>;
    }

    public get uptime(): number {
        return this.readyTimestamp ? Date.now() - this.readyTimestamp : 0;
    }

    public get user(): If<Ready, User> {
        return this.#user;
    }

    public static createEvent<T extends keyof ClientEventMap>(props: CreateEventProps<T>) {
        return props;
    }

    public static createCommand(props: CommandProps) {
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
    // thêm vào trong class Bot

    public async startSafe() {
        try {
            this.once("fullyReady", () => {
                this.#readyAt = new Date() as any;
            });

            const { user } = await this.connect();

            this.#user = user as any;

            console.log(`> Logged in as ${user.name} (${user.id})`);
            console.log("> Initializing handlers...");

            await this.initializeHandlers();
        } catch (err) {
            // đẩy lên cho index.ts restart
            (this as any).emit("__fatal__", err as Error);
            throw err;
        }
    }

    public async reconnectSafe() {
        try {
            // tuỳ lib, nếu có close/disconnect thì gọi trước
            // @ts-ignore
            if (typeof this.disconnect === "function") {
                try {
                    await this.disconnect();
                } catch {}
            }

            await this.connect();

            console.log("✅ Reconnected");
        } catch (err) {
            (this as any).emit("__fatal__", err as Error);
            throw err;
        }
    }
    public start() {
        this.once("fullyReady", () => {
            logger.debug("> Client is fully ready!");
            this.#readyAt = new Date() as If<Ready, Date>;
        });

        this.connect().then(({ user }) => {
            logger.debug(`> Logged in as ${user.name} (ID: ${user.id})`);
            logger.debug("> Please wait until bot is fully ready...");

            this.#user = user as If<Ready, User>;
            this.initializeHandlers();
        });
    }
}
