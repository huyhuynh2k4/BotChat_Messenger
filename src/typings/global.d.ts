declare namespace NodeJS {
    interface ProcessEnv {
        readonly BOT_PREFIX: string;

        // Facebook Messenger Credential
        readonly FB_UID: string;
        readonly FB_PASSWORD: string;

        // Cookies file path
        readonly COOKIE_FILE_PATH: string;
    }
}
