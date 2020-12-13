import { Message } from "discord.js";
import { XP_PER_CHARACTER, NEXT_LEVEL_XP_FACTOR } from "./../config.js";
import { DataBase } from "../db/client.js";

export class XpManager {
  constructor(database = new DataBase()) {
    this.db = database;
  }

  getUserInfo = async (userId) => {
    const user = await this.db.getUser(userId);
    let level = user[0].get("level");
    let xp = user[0].get("xp");
    let xpNeeded = user[0].get("xpNeeded");
    return { level, xp, xpNeeded };
  };

  manageXp = (message = new Message()) => {
    let userId = message.author.id;

    this.db.getUser(userId).then((result) => {
      let level = result[0].get("level");
      let xp = result[0].get("xp");
      let xpNeeded = result[0].get("xpNeeded");
      let xpChangedDate = result[0].get("xpChangedDate");

      const now = new Date();
      now.setMilliseconds(0);

      const calculateXp = () => {
        let caracteres =
          message.content.length <= 75 ? message.content.length : 75;
        xp += caracteres * XP_PER_CHARACTER;
        xpChangedDate = now;

        if (xp >= xpNeeded) {
          xp = 0.0;
          xpNeeded += xpNeeded * NEXT_LEVEL_XP_FACTOR;
          level += 1;

          message.channel.send(`<@${userId}> subiu para o nível ${level}`);
        }
      };

      if (xpChangedDate != null) {
        const timeDiff = (now - xpChangedDate) / 1000;

        if (timeDiff >= 30) {
          calculateXp();
        }
      } else {
        calculateXp();
      }

      this.db.updateUser(userId, level, xp, xpNeeded, xpChangedDate);
    });
  };
}
