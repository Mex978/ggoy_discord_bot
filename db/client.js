import { Sequelize } from "sequelize";
import { INITIAL_XP_NEEDED } from "./../config.js";

export class DataBase {
  constructor() {
    this.user = this.initDb();
  }
  initDb() {
    let sequelize;
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "./../db/users.sqlite",
      logging: false,
      transactionType: "IMMEDIATE",
    });

    var User = sequelize.define(
      "user",
      {
        userId: {
          type: Sequelize.INTEGER,
          field: "user_id",
        },
        level: {
          type: Sequelize.INTEGER,
          field: "level",
        },
        xp: {
          type: Sequelize.FLOAT,
          field: "xp",
        },
        xpNeeded: {
          type: Sequelize.FLOAT,
          field: "xp_needed",
        },
      },
      {
        freezeTableName: true, // Model tableName will be the same as the model name
      }
    );

    User.sync();
    return User;
  }

  getUser(userId) {
    return this.user.findOrCreate({
      where: { userId: userId },
      defaults: {
        level: 1,
        xp: 0.0,
        xpNeeded: INITIAL_XP_NEEDED,
      },
    });
  }

  updateUser(userId, level, xp, xpNeeded) {
    this.user.findOne({ where: { userId: userId } }).then((user) => {
      if (!user) {
        console.log("error");
        return;
      }

      user.level = level;
      user.xp = xp;
      user.xpNeeded = xpNeeded;
      user.save();
    });
  }
}
