import Discord from "discord.js";
import fs from "fs";
import { join } from "path";

import config from "./data/config.json";
import log4js from "log4js";

import Command from "./utils/Command";

const Logger = log4js.getLogger();

export default class EurBotClient extends Discord.Client {
    private commands: { [command: string]: Command } = {};
    async init(): Promise<void> {
        let knownCommands: string[] = [];
        const readDir = (dir: string): void => {
            fs.readdir(join(__dirname, dir), (err, files) => {
                if (err) return Logger.error(err);
                files.forEach(file => {
                    if (!(file.endsWith(".js") || file.endsWith(".ts"))) {
                        readDir(dir + file + '/');
                        return;
                    }

                    const props = require(`${dir}${file}`)
                    const commandName = file.split(".")[0]
                    Logger.info(`Loading ${commandName}`)

                    const command: Command = new (props.default)(commandName)
                    // Check if command is already registered
                    if (knownCommands.includes(commandName.toLowerCase()))
                        Logger.error(`${commandName} already exists!`)
                    knownCommands.push(commandName.toLowerCase()) 

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