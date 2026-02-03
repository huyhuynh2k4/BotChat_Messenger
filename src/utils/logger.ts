import { debug } from "debug";

export type LoggerBindFn = typeof console.log | typeof console.error | typeof console.warn;

export class logger {
    static createCustomLogger(name: string, fn: LoggerBindFn) {
        const log = debug(`bot:${name}`);

        function customLog(...args: string[]) {
            const date = new Date();
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const seconds = String(date.getSeconds()).padStart(2, "0");
            const time = `${hours}:${minutes}:${seconds}`;

            args[0] = `  \x1b[35m[${time}]\x1b[0m ` + args[0].trim();

            fn(...args);
        }

        log.log = customLog.bind(console);

        return log;
    }

    static #debug = this.createCustomLogger("debug", console.log);
    static #error = this.createCustomLogger("error", console.error);
    static #warn = this.createCustomLogger("warn", console.warn);

    static debug(data: unknown) {
        this.#debug(typeof data === "string" ? "%s" : "%O", data);
    }

    static error(data: unknown) {
        this.#error(typeof data === "string" ? "%s" : "%O", data);
    }

    static warn(data: unknown) {
        this.#warn(typeof data === "string" ? "%s" : "%O", data);
    }
}
