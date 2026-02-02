import fs from "fs";
import { Client, Utils } from "meta-messenger.js";
import path from "path";

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

    public start() {
        this.once("fullyReady", () => {
            console.log("> Client is fully ready!");
        });

        this.connect().then(({ user }) => {
            console.log(`> Logged in as ${user.name} (ID: ${user.id})`);
            console.log("> Please wait until bot is fully ready...");
        });
    }
}
