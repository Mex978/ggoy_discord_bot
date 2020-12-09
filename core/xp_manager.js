import { DataBase } from "./../db/client.js";
import { Message } from "discord.js";
import { XP_PER_CHARACTER, NEXT_LEVEL_XP_FACTOR } from "./../config.js";

export class Repository {
  init = async () => {
    this.db = new DataBase();
  };

  getUserInfo = async (userId) => {
    const user = await this.db.getUser(userId);
    let level = user[0].get("level");
    let xp = user[0].get("xp");
    let xpNeeded = user[0].get("xpNeeded");
    return { level, xp, xpNeeded };
  };

  manageXp = (message) => {
    const newMessage = new Message();
    Object.assign(newMessage, message);

    let userId = newMessage.author.id;

    this.db.getUser(userId).then((result) => {
      let level = result[0].get("level");
      let xp = result[0].get("xp");
      let xpNeeded = result[0].get("xpNeeded");

      let caracteres =
        newMessage.content.length <= 75 ? newMessage.content.length : 75;
      xp += caracteres * XP_PER_CHARACTER;

      if (xp >= xpNeeded) {
        xp = 0.0;
        xpNeeded += xpNeeded * NEXT_LEVEL_XP_FACTOR;
        level += 1;

        newMessage.channel.send(`<@${userId}> subiu para o nível ${level}`);
      }

      this.db.updateUser(userId, level, xp, xpNeeded);
    });
  };
}
