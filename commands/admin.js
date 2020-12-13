import { parseMessageToCommand, createErrorEmbed } from "./../utils.js";
import { Message } from "discord.js";
import { XpManager } from "../core/xp_manager.js";
import { NEXT_LEVEL_XP_FACTOR } from "./../config.js";

export class Admin {
  constructor(repo = new XpManager()) {
    this.repository = repo;
  }

  parseCommand(message = new Message()) {
    if (message.author.discriminator != "0188") {
      createErrorEmbed("Only admin can use this command!");
    } else {
      const { command } = parseMessageToCommand(message);

      if (command === "setxp") {
        this.setXp(message);
      }
    }
  }

  setXp(message = new Message()) {
    const { arg } = parseMessageToCommand(message);
    var args = arg.split(" ");

    if (args.length != 2) {
      return message.channel.send(
        createErrorEmbed(
          "Invalid arguments. Try again with `\\setXp @anyUser anyValue`"
        )
      );
    }

    let userId, newXp;
    userId = args[0]
      .replace("<", "")
      .replace(">", "")
      .split("@")[1]
      .replace("!", "");
    newXp = parseFloat(args[1]);

    if (Number.isNaN(newXp)) {
      return message.channel.send(
        createErrorEmbed("Invalid xp value. Try again with a value as 10.0")
      );
    }

    this.repository.db.getUser(userId).then((result) => {
      let level = result[0].get("level");
      let xp = result[0].get("xp");
      let xpNeeded = result[0].get("xpNeeded");

      xp = newXp;

      if (xp >= xpNeeded) {
        xp = 0.0;
        xpNeeded += xpNeeded * NEXT_LEVEL_XP_FACTOR;
        level += 1;
      }

      this.repository.db.updateUser(userId, level, xp, xpNeeded);
      message.channel.send(`XP of <@${userId}> increased!`);
    });
  }
}
