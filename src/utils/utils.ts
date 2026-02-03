import type { E2EEMessage, Message } from "meta-messenger.js";

export function checkMessageE2EE(message: Message | E2EEMessage): message is E2EEMessage {
    return "debugType" in message;
}
