import { Message } from 'discord.js';

import Command from '../../utils/Command';
import client from '../../main';

export default class Ping extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Admin",
            help: "Pong.",
            usage: "ping"
        });
    }

    async run(message: Message): Promise<Message> {
        const msgPing: string = "**Pinging..**";
        const pingMsg: Message = await message.reply(msgPing);
        const msgPong: string = [
            "**Pong!**",
            `The message round-trip took **${pingMsg.createdTimestamp - message.createdTimestamp}ms**.`,
            client.ws.ping ? `The heartbeat ping is **${Math.round(client.ws.ping)}ms**.` : ""
        ].join(" ").trim();
        await pingMsg.edit(msgPong);
        return pingMsg;
    }
}