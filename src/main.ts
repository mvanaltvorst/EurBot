import log4js from "log4js";
import EurBotClient from './EurBotClient';
import fs from "fs";
import { join } from "path";

log4js.configure({
    appenders: {
        file: { type: "dateFile", filename: "./logs/eurbot", alwaysIncludePattern: true, backups: 31, compress: true },
        out: { type: "stdout" },
    }, categories: {
        default: { appenders: ["file", "out"], level: "debug" }
    }
});

const Logger = log4js.getLogger();

const client = new EurBotClient();
if (!fs.existsSync(join(__dirname, "./data/config.json"))) {
    Logger.error("config.json does not exist");
} else {
    client.init();
}

export default client
