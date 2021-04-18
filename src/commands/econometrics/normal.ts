import { Message } from 'discord.js';

import Command from '../../utils/Command';
import client from '../../main';
import distributions, { Distribution } from 'distributions';

export default class Normal extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Econometrics",
            help: "Gives info about normal distribution",
            usage: "normal [mean] ([var]v | [stddev]s) [x]",
            aliases: ["z"],
        });
    }

    async run(message: Message, args: string[]): Promise<Message> {
        if (args.length >= 2) {
            const mean = parseInt(args[0]);
            let stddev: number;
            let variance: number;
            if (args[1][-1] === 's') {
                stddev = parseInt(args[1].substr(0, -1));
                variance = stddev*stddev;
            } else if (args[1][-1] === 'v') {
                variance = parseInt(args[1].substr(0, -1));
                stddev = Math.sqrt(variance);
            } else {
                return this.parseError(message);
            }
            
            let response: string;
            if (args.length >= 3) {
                response = [
                    "**Normal**",
                    `**Mean:** ${mean}`,
                    `**Variance:** ${variance}`,
                    `**Standard deviation:** ${stddev}`,
                ].join("\n");
            } else {
                let x: number = parseInt(args[2]);
                let normal: Distribution = distributions.Normal(mean, stddev);
                response = [
                    "**Normal**",
                    `**Mean:** ${mean}`,
                    `**Variance:** ${variance}`,
                    `**Standard deviation:** ${stddev}`,
                    `**CDF(${x}):** ${normal.cdf(x)}`,
                ].join("\n")
            }
            return message.reply(response);
        } else {
            return this.parseError(message);
        }
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

    async parseError(message: Message): Promise<Message> {
        return message.reply("Did not understand query, please check `!h z`")
    }
}