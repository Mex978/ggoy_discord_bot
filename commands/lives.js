import { Message } from "discord.js";
import { TwitchListener } from "../core/twitch_listener.js";
import {
  createErrorEmbed,
  createSuccessEmbed,
  parseMessageToCommand,
} from "../utils.js";

export class Lives {
  constructor(msg = new Message(), repo = new TwitchListener()) {
    this.repository = repo;
    this.message = msg;
  }

  parseCommand() {
    const { command, arg } = parseMessageToCommand(this.message);

    if (command === "live") {
      const channels = arg.split(" ");
      this.addChannel(channels);
    }
  }

  addChannel(channels = new Array()) {
    channels.forEach((channel) => {
      this.repository.getChannelId(channel).then((result) => {
        if (result == null) {
          this.message.channel.send(
            createErrorEmbed(`${channel} already listened!`)
          );
        } else {
          result
            ? this.message.channel.send(
                createSuccessEmbed(`${channel} added to be listened!`)
              )
            : this.message.channel.send(
                createErrorEmbed(`${channel} not found`)
              );
        }
      });
    });
  }
}
