declare namespace NodeJS {
    interface ProcessEnv {
        readonly DEBUG: string;
        readonly BOT_PREFIX: string;

        // API Key
        readonly API_KEY: string;
        readonly BASE_URL: string;
        readonly MODEL_NAME: string;

        // Cookies file path
        readonly COOKIE_FILE_PATH: string;
    }
}
