import sqz from "sequelize";
import { INITIAL_XP_NEEDED } from "./../config.js";

export class DataBase {
  constructor() {
    this.user = this.initDb();
  }

  initDb() {
    let sequelize;
    sequelize = new sqz.Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });

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
        cuckValue: {
          type: sqz.DataTypes.FLOAT,
          field: "cuck_value",
        },
        fidalgoValue: {
          type: sqz.DataTypes.FLOAT,
          field: "fidalgo_value",
        },
        goyValue: {
          type: sqz.DataTypes.FLOAT,
          field: "goy_value",
        },
        cuckChangedDate: {
          type: sqz.DataTypes.DATE,
          field: "cuck_changed_date",
        },
        goyChangedDate: {
          type: sqz.DataTypes.DATE,
          field: "goy_changed_date",
        },
        fidalgoChangedDate: {
          type: sqz.DataTypes.DATE,
          field: "fidalgo_changed_date",
        },
      },
      {
        freezeTableName: true, // Model tableName will be the same as the model name
      }
    );

    User.sync({ alter: true });
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
