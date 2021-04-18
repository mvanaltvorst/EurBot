import client from "../main"
import { DMChannel, Message, TextChannel } from 'discord.js';
import Command from "../utils/Command";
import config from "../data/config.json"
import log4js from 'log4js';

const Logger = log4js.getLogger("message");

interface ParsedCommand {
    args: string[]
    command: string
    cmd: Command
}

function getCommand(message: Message): ParsedCommand | false {
    if (!message.content.toLowerCase().startsWith(config.prefix)) return false
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
    const command = args.shift()?.toLowerCase()
    if (!command) return false

    let cmd: Command = client.commands[command];

    // If that command doesn't exist, try to find an alias
    if (!cmd) {
        const foundCommand: [string, Command] | undefined = Object.entries(
            client.commands
        ).find(x => x[1].aliases.includes(command));
        // If that command doesn't exist, silently exit and do nothing
        if (foundCommand === undefined) return false;
        cmd = foundCommand[1];
    }
    return { args, command, cmd }
}

async function handleCommand(message: Message, cmdInfo: ParsedCommand): Promise<boolean> {
    const { args, command, cmd }: ParsedCommand = cmdInfo
    try {
        const msg = cmd.run(message, args, command)
        if (!msg || message.channel.type !== "text") return true
        const reply = await msg
        if (!reply) return true
        if (!(reply instanceof Message)) return true

        try {
            await reply.react("❌")
            reply.awaitReactions(
                (reaction, user) => reaction.emoji.name == "❌" && (user.id == message.author.id || config.admins.includes(user.id)),
                { max: 1, time: 60000, errors: ["time", "messageDelete", "channelDelete", "guildDelete"] }
            ).then(async (collected) => {
                client.recentMessages = client.recentMessages.filter(k => k != reply)
                if (collected && collected.size > 0 && reply.deletable) {
                    await reply.delete()
                }
            }).catch(async () => {
                client.recentMessages = client.recentMessages.filter(k => k != reply)

                const user = client.user
                if (user == undefined || reply.deleted) return
                await Promise.allSettled(reply?.reactions?.cache.map((reaction) => client.user && reaction.users.cache.has(client.user.id) && reaction.emoji.name == "❌" ? reaction.users.remove(user) : undefined).filter(f => f))
            })
            client.recentMessages.push(reply)
        } catch (error) {
            if (reply.editable)
                await reply.edit(reply.content + "\n\nUnable to add ❌ reaction, please contact admins of this discord guild to give this bot permission to add reactions. Doing so, will allow users to delete bot replies within some time.")
            else
                Logger.error(error)
        }
    } catch (error) {
        Logger.error(error)
    }
    return true
}

export async function handle(message: Message): Promise<void> {
    if (message.author.bot) return

    const cmdInfo: ParsedCommand | false = await getCommand(message)

    if (cmdInfo && cmdInfo.cmd) {
        if (message.channel instanceof DMChannel)
            Logger.info(`${message.author.id} (${message.author.tag}) executes command in ${message.channel.recipient.tag}: ${message.content}`)
        else
            Logger.info(`${message.author.id} (${message.author.tag}) executes command in ${message.channel instanceof TextChannel ? message.channel.name : message.channel.type} (guild ${message.guild ? message.guild.id : "NaN"}): ${message.content}`)

        //addStats(message, cmdInfo)
        await handleCommand(message, cmdInfo)
    } else if (message.channel.type === "dm") {
        Logger.info(`${message.author.id} (${message.author.tag}) sends message ${message.type} in dm: ${message.content}`)
    }
}