import { Message } from 'discord.js';

import Command from '../../utils/Command';
import distributions, { Distribution } from 'distributions';
import log4js from 'log4js';

const Logger = log4js.getLogger("normal");

export default class Normal extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Econometrics",
            help: "Gives info about normal distribution",
            usage: "normal <mean> ([var]v | [stddev]s) [x]",
            aliases: ["z"],
        });
    }

    async run(message: Message, args: string[]): Promise<Message> {
        Logger.info(args);
        let response: string;
        if (args.length >= 2) {
            const mean = parseFloat(args[0].replace(",", "."));
            let stddev: number;
            let variance: number;
            if (args[1].slice(-1) === 's') {
                stddev = parseFloat(args[1].slice(0, -1).replace(",", "."));
                variance = stddev*stddev;
            } else if (args[1].slice(-1) === 'v') {
                variance = parseFloat(args[1].slice(0, -1).replace(",", "."));
                stddev = Math.sqrt(variance);
            } else {
                stddev = parseFloat(args[1].replace(",", ".")); // default to stddev
                variance = stddev*stddev;
            }
            
            if (args.length >= 3) {
                let x: number = parseFloat(args[2].replace(",", "."));
                let normal: Distribution = distributions.Normal(mean, stddev);
                response = [
                    "**Normal**",
                    `**Mean:** ${mean}`,
                    `**Variance:** ${variance}`,
                    `**Standard deviation:** ${stddev}`,
                    `**CDF(${x}):** ${normal.cdf(x)}`,
                ].join("\n")
            } else {
                response = [
                    "**Normal**",
                    `**Mean:** ${mean}`,
                    `**Variance:** ${variance}`,
                    `**Standard deviation:** ${stddev}`,
                ].join("\n");
            }
        } else {
            let x: number = parseFloat(args[0].replace(",", "."));
            let normal: Distribution = distributions.Normal(0, 1);
            response = [
                "**Standard normal**",
                `**CDF(${x}):** ${normal.cdf(x)}`,
            ].join("\n")
        }
        return message.channel.send(response);
    }

    async parseError(message: Message): Promise<Message> {
        return message.channel.send("Did not understand query, please check `!h z`")
    }
}