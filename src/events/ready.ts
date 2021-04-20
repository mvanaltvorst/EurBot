import client from "../main";
import log4js from 'log4js';
import { GuildChannel, TextChannel } from "discord.js";

const Logger = log4js.getLogger("ready");

export async function handle(): Promise<void> {
    Logger.info(`In ${(client.channels.cache).size} channels on ${(client.guilds.cache).size} servers, for a total of ${(client.users.cache).size} users.`)

    //client.estimatorChannel = await client.channels.fetch("834075783379157043");
    client.estimatorChannels = await client.guilds.cache.map(guild => {
        let channel: GuildChannel | undefined = guild.channels.cache.find(ch => ch.name == "estimator");
        if (channel !== undefined && channel.isText()) return channel as TextChannel;
    }).filter((channel): channel is TextChannel => channel !== undefined);
    Logger.info(`Found ${client.estimatorChannels.length} estimator channels`);
    await client.user?.setStatus("online");

    await client.estimatorNotifier.fetchArticles();
}