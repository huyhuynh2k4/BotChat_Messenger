import { Bot } from "@/classes";

export default Bot.createEvent({
    eventName: "message",
    emit: (client, message) => {
        console.log("Received message:", message);
    },
});
