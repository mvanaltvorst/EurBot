import Command from "../../utils/Command"
import Discord, { Message, TextChannel } from "discord.js"
import client from "../../main"
import { CommandCategory } from "../../utils/Command"
import config from "../../data/config.json"
import { PermissionResolvable } from "discord.js"

export default class Help extends Command {
    constructor(name: string) {
        super({
            name,
            category: "Hidden",
            help: "Get some help.",
            usage: "help [command]",
            aliases: ["command", "commands", "h"]
        })
    }

    async run(message: Message, args: string[]): Promise<Message | Message[]> {
        const { commands } = client
        if (!args || args.length < 1) {
            const categorized: { [a in CommandCategory]: string[] } = {
                Econometrics: [],
                Meta: [],
                Admin: [],
                Hidden: [],
            }
            Object.values(commands).forEach(cmd => {
                const category = cmd.category;
                categorized[category].push(cmd.commandName)
            })

            return message.channel.send(
                `**Commands**: 
${Object.entries(categorized)
        .filter(([category]) =>
            !(category.toLowerCase() == "hidden" ||
                (!config.admins.includes(message.author.id) && category.toLowerCase() == "admin"))
        ).map(([category, items]) => `**${category}**
    ${items.sort((a, b) => a.localeCompare(b)).map(cmd => `${config.prefix}${cmd}`).join(", ")}`)
        .join("\n")}
*Make sure to check out \`${config.prefix}help <command name>\` for more information about a specific command, you might find some useful shortcuts/tips (like command aliases).*`
            );
        }

        let commandName = args[0]

        let command: Command | null = client.commands[commandName];
        // Check aliases
        if (command == null) {
            let found: [string, Command] | undefined = Object.entries(commands)
                .find(([name, cmd]) => cmd.aliases.includes(commandName));
            if (found !== undefined) command = found[1];
        }

        if (command == null)
            return message.channel.send("Command does not exist")

        if (command.help == false)
            return message.channel.send(`${command.commandName}`)

        return message.channel.send(`${command.commandName} - ${command.help}
Usage: \`${config.prefix}${command.usage}\`${command.aliases.length !== 0 ? `
Aliases: ${command.aliases.map(k => `\`${k}\``).join(", ")}` : ""}`)
    }
}