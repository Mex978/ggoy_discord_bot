import mongoose from "mongoose";

import { INITIAL_XP_NEEDED, MONGODB_URL } from "../config.js";

export class DataBase {
  constructor() {
    const { User, Lives } = this.initDb();
    this.users = User;
    this.lives = Lives;
  }

  initDb() {
    mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const User = mongoose.model("User", {
      userId: Number,
      level: Number,
      xp: Number,
      xpNeeded: Number,
      cuckValue: Number,
      fidalgoValue: Number,
      goyValue: Number,
      cuckChangedDate: Date,
      goyChangedDate: Date,
      fidalgoChangedDate: Date,
      xpChangedDate: Date,
    });

    const Lives = mongoose.model("Lives", {
      channelName: String,
      channelId: String,
    });

    Lives.findOneOrCreate = async function findOneOrCreate(
      condition,
      defaults,
      callback
    ) {
      const self = this;
      return self.findOne(condition, (err, result) => {
        let newDict = Object.assign({}, condition, defaults);

        return result == null
          ? callback(err, result)
          : self.create(newDict, (err, result) => {
              return callback(err, result);
            });
      });
    };

    return { User, Lives };
  }

  async getUser(userId) {
    return this.users.findOne({ userId: userId }).then((result, err) => {
      if (result != null) {
        console.log("User founded");
        return result;
      } else if (err == null && result == null) {
        console.log("User created");

        return this.users.create({
          userId: userId,
          level: 1,
          xp: 0.0,
          xpNeeded: INITIAL_XP_NEEDED,
        });
      } else {
        console.log(err);
        return null;
      }
    });
  }

  updateUser(userId, level, xp, xpNeeded, xpChangedDate) {
    this.users.findOne({ userId: userId }, function (_, doc) {
      (doc.level = level),
        (doc.xp = xp),
        (doc.xpNeeded = xpNeeded),
        (doc.xpChangedDate = xpChangedDate),
        doc.save();
    });
  }

  getAllUsers() {
    return this.users.find();
  }
}
