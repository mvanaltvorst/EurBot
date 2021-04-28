import { EstimatorArticle } from './Types';
import SQLite, { Statement } from 'better-sqlite3';
import { ensureDirSync } from 'fs-extra';
import log4js from 'log4js';
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { MessageEmbed } from 'discord.js';
import client from '../main';

const ESTIMATOR_TIMEOUT = 30*60*1000; // 30 minutes in milliseconds

const Logger = log4js.getLogger("EstimatorManager");
ensureDirSync("data/");

export default class EstimatorManager {
    private sql = new SQLite("data/news.db");
    private addEstimatorStatement: Statement;
    private getEstimatorByIDStatement: Statement;
    private lastFetched: number = 0;

    constructor() {
        process.on("exit", () => this.sql.close());
        process.on("SIGHUP", () => process.exit(128+1));
        process.on("SIGINT", () => process.exit(128+2));
        process.on("SIGTERM", () => process.exit(128+15));

        this.sql.exec("CREATE TABLE IF NOT EXISTS estimator (post_id TEXT, title TEXT, date TEXT, authors TEXT, tag TEXT, image_url TEXT, slug TEXT, PRIMARY KEY (post_id))");

        this.addEstimatorStatement = this.sql.prepare(
            "INSERT OR REPLACE INTO estimator VALUES (@post_id, @title, @date, @authors, @tag, @image_url, @slug)"
        );
        this.getEstimatorByIDStatement = this.sql.prepare(
            "SELECT * FROM estimator WHERE post_id = @post_id"
        );
    }

    public async fetchArticles(): Promise<void> {
        setTimeout(() => {
            this.fetchArticles().catch(Logger.error)
        }, ESTIMATOR_TIMEOUT);
        if (this.lastFetched > Date.now() - (ESTIMATOR_TIMEOUT / 1000 - 5)) return;
        this.lastFetched = Date.now();
        Logger.info("Fetching new estimator...");
        try {
            const res = await fetch(
                "https://estimator.faector.nl/archive"
            );
            const $ = cheerio.load(await res.text());
            const articles: (EstimatorArticle)[] = $(".headline").toArray().flatMap(elem => {
                const post_id = $(elem).find("a").attr("href")?.split("/")[1];
                const title = $(elem).find("h2 a").text();
                const authors: string[] = $(elem).find("li").toArray().map(elem => $(elem).text());
                const tag = $(elem).find(".tag").text();
                const image_url = $(elem).find("img").attr("src");
                const slug = $(elem).find(".preview-text").text();
                const date = $(elem).find(".meta__publishdate").text();
                if (post_id === undefined || image_url === undefined) return [];
                return [{
                    post_id,
                    title,
                    authors,
                    tag,
                    image_url,
                    slug,
                    date
                }]
            });
            articles.reverse().forEach(async article => {
                let saved = await this.getEstimatorByID(article.post_id);
                if (!saved) {
                    await this.addEstimator(article)
                    await this.post(article);
                };
            });
        } catch (error) {
            Logger.error("An error occured while fetching Estimator:", error);
        }
    }

    private async getEstimatorByID(post_id: string): Promise<EstimatorArticle | null> {
        return this.getEstimatorByIDStatement.get({
            post_id
        });
    }

    private async addEstimator(post: EstimatorArticle): Promise<void> {
        this.addEstimatorStatement.run({
            post_id: post.post_id,
            title: post.title,
            date: post.date,
            authors: post.authors.join(", "),
            tag: post.tag,
            image_url: post.image_url,
            slug: post.slug
        });
    }

    private getArticleEmbed(article: EstimatorArticle): MessageEmbed {
        const embed = new MessageEmbed()
            .setTitle(article.title)
            .setAuthor(article.authors)
            .setTimestamp(Date.parse(article.date))
            .setURL(`https://estimator.faector.nl/article/${article.post_id}`)
            .setColor("#00EA69")
            .setDescription(article.slug)
            .setImage(`https://estimator.faector.nl/${article.image_url}`)
            .setFooter(article.tag);
        return embed;
    }

    private async post(article: EstimatorArticle): Promise<void> {
        Logger.info(article);
        const embed = this.getArticleEmbed(article);
        if (client.estimatorChannels === undefined) {
            Logger.error("Cannot find #estimator channels");
        } else {
            client.estimatorChannels.forEach(channel => {
                channel.send(embed);
            })
        }
    }
}