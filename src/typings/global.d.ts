declare namespace NodeJS {
    interface ProcessEnv {
        readonly FB_UID: string;
        readonly FB_PASSWORD: string;
        readonly COOKIE_FILE_PATH: string;
    }
}
