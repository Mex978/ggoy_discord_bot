import { PREFIX } from "../config.js";
import { createErrorEmbed } from "./../utils.js";
import { Message } from "discord.js";

const TIMER = 3000;

export class Filters {
  constructor(msg) {
    this.message = new Message();
    Object.assign(this.message, msg);
  }

  parseMessage() {
    if (this.isDeveloper()) {
      return false;
    }
    return this.developerFilter() || this.botFilter();
  }

  botFilter() {
    if (this.message.author.bot) return true;
  }

  isDeveloper() {
    return this.message.author.discriminator == "0188";
  }

  developerFilter() {
    if (
      this.message.channel.name == "channel-test" &&
      !["0188", "6234"].includes(this.message.author.discriminator)
    ) {
      return this.message.channel
        .send(
          createErrorEmbed("Only the Developer and GGoyBot can interact here")
        )
        .then((msg) => {
          setTimeout(async () => {
            await msg.delete();
            await this.message.delete();
          }, TIMER);
          return true;
        });
    } else {
      return false;
    }
  }

  channelToCommandsFilter() {
    // if (
    //   this.message.content.startsWith(PREFIX) &&
    //   this.message.channel.name != "comandos-bot" &&
    //   this.message.channel.name != "chat-dos-bots"
    // ) {
    //   return this.message.channel
    //     .send(
    //       createErrorEmbed(
    //         "Commands not available in that text channel, please type in the `commandos-bot`"
    //       )
    //     )
    //     .then((msg) => {
    //       setTimeout(async () => {
    //         await msg.delete();
    //         await this.message.delete();
    //       }, TIMER);

    //       return true;
    //     });
    // } else
    if (
      !this.message.content.startsWith(PREFIX) &&
      !this.message.content.startsWith("!") &&
      !this.message.content.startsWith("-") &&
      !this.message.content.startsWith("_") &&
      !this.message.content.startsWith("/") &&
      !this.message.content.startsWith("$") &&
      this.message.channel.name.includes("bot")
    ) {
      return this.message.channel
        .send(createErrorEmbed("Only commands are available on this channel"))
        .then((msg) => {
          setTimeout(async () => {
            await msg.delete();
            await this.message.delete();
          }, TIMER);

          return true;
        });
    } else {
      return false;
    }
  }
}
