import { Message } from "discord.js";
import { XP_PER_CHARACTER, NEXT_LEVEL_XP_FACTOR } from "./../config.js";
import { DataBase } from "../db/client.js";
import { Rank } from "../commands/rank.js";

export class XpManager {
  constructor(database = new DataBase()) {
    this.db = database;
  }

  getUserInfo = async (userId) => {
    const user = await this.db.getUser(userId);
    let level = user.level;
    let xp = user.xp;
    let xpNeeded = user.xpNeeded;
    return { level, xp, xpNeeded };
  };

  // getUserRank = async (userId) => {
  //   const user = await this.db.getUser(userId);
  //   const users = await this.db.getAllUsers();

  //   let ranks = [];

  //   while (users.length > 0) {
  //     let greatestRank = users[0];
  //     users.map((u) => {
  //       if (u.xpNeeded >= greatestRank.xpNeeded) {
  //         if (u.xp >= greatestRank.xp) {
  //           greatestRank = u;
  //         }
  //       }
  //     });

  //     ranks.push(greatestRank);
  //     const index = users.indexOf(5);
  //     if (index > -1) {
  //       users.splice(index, 1);
  //     }
  //   }

  //   return ranks.indexOf(user);
  // };

  manageXp = (message = new Message()) => {
    let userId = message.author.id;

    this.db.getUser(userId).then((result) => {
      let level = result.level;
      let xp = result.xp;
      let xpNeeded = result.xpNeeded;
      let xpChangedDate = result.xpChangedDate;

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
