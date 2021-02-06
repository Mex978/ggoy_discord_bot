import { parseMessageToCommand, getCardHtml } from "./../utils.js";
import { Message, MessageAttachment } from "discord.js";
import { CUSTOM_FONT } from "./../config.js";
import { XpManager } from "../core/xp_manager.js";
import nodeHtmlToImage from "node-html-to-image";

export class Rank {
  constructor(msg = new Message(), repo = new XpManager()) {
    this.repository = repo;

    this.message = msg;
  }

  parseCommand() {
    const { command } = parseMessageToCommand(this.message);

    if (command === "level") {
      this.getMyLevel();
    }
  }

  getMyLevel() {
    this.repository.getUserInfo(this.message.author.id).then((user) => {
      const name = this.message.author.username;
      const discriminator = this.message.author.discriminator;
      const mainRole = this.message.member.roles.cache.array()[0].name;
      // const rank = this.repository.getUserRank(this.message.author.id);

      const cardHtml = getCardHtml(
        name,
        discriminator,
        mainRole,
        user.level,
        user.xp,
        user.xpNeeded,
        // rank,
        CUSTOM_FONT
      );

      nodeHtmlToImage({
        output: "./card.png",
        html: cardHtml,
        quality: 100,
        puppeteerArgs: { args: ["--no-sandbox"] },
      }).then(() => {
        const attachment = new MessageAttachment("./card.png");
        this.message.channel.send(attachment);
        console.log("The image was created successfully!");
      });
    });
  }
}
