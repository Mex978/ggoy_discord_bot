import sqz from "sequelize";
import { INITIAL_XP_NEEDED } from "./../config.js";

export class DataBase {
  constructor() {
    this.user = this.initDb();
  }

  initDb() {
    let sequelize;
    console.log(process.env.DATABASE_URL);
    sequelize = new sqz.Sequelize(process.env.DATABASE_URL);

    var User = sequelize.define(
      "user",
      {
        userId: {
          type: sqz.DataTypes.BIGINT,
          field: "user_id",
        },
        level: {
          type: sqz.DataTypes.INTEGER,
          field: "level",
        },
        xp: {
          type: sqz.DataTypes.FLOAT,
          field: "xp",
        },
        xpNeeded: {
          type: sqz.DataTypes.FLOAT,
          field: "xp_needed",
        },
      },
      {
        freezeTableName: true, // Model tableName will be the same as the model name
      }
    );

    User.sync({ force: true });
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
