import { Message, Client } from "discord.js";
import fs from "fs";
import { join } from "path";

import config from "./data/config.json";
import log4js from "log4js";

import Command from "./utils/Command";

const Logger = log4js.getLogger();

export default class EurBotClient extends Client {
    readonly commands: { [command: string]: Command } = {};
    public recentMessages: Message[] = [];
    async init(): Promise<void> {
        fs.readdir(join(__dirname, "events/"), (err, files: string[]): void => {
            if (err) return Logger.error(err);
            files.forEach((file: string) => {
                const event = require(`./events/${file}`);
                const eventName: string = file.split('.')[0];
                Logger.info(`Loading event ${eventName}`);
                this.on(eventName, event.handle);
            })
        });

        let knownCommands: string[] = [];
        const readDir = (dir: string): void => {
            fs.readdir(join(__dirname, dir), (err, files) => {
                if (err) return Logger.error(err);
                files.forEach((file: string) => {
                    if (!(file.endsWith(".js") || file.endsWith(".ts"))) {
                        readDir(dir + file + '/');
                        return;
                    }

                    const props = require(`${dir}${file}`);
                    const commandName: string = file.split(".")[0];
                    Logger.info(`Loading command ${commandName}`);

                    const command: Command = new (props.default)(commandName);

                    // Check if command is already registered
                    if (knownCommands.includes(commandName.toLowerCase())) {
                        Logger.error(`${commandName} already exists!`);
                    }

                    knownCommands.push(commandName.toLowerCase()) ;

                    for (const alias of command.aliases) {
                        if (knownCommands.includes(alias)) {
                            Logger.error(`${commandName} is trying to register an alias that's already registered: ${alias}`);
                        }
                        knownCommands.push(alias);
                    }

                    this.commands[commandName] = command;
                })
            })
        }
        readDir("./commands/");
        await this.login(config.token);
    }
}