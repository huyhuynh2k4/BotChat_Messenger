import { Bot } from "@/classes";

export default Bot.createEvent({
    eventName: "e2eeMessage",
    emit: (client, message) => {
        console.log("Received E2EE message:", message);
    },
});
