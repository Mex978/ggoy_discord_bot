import {
  createErrorEmbed,
  createSuccessEmbed,
  parseMessageToCommand,
} from "./../utils.js";
import { Message } from "discord.js";
import timediff from "timediff";
import { XpManager } from "../core/xp_manager.js";

export class Funny {
  constructor(msg = new Message(), repo = new XpManager()) {
    this.repository = repo;
    this.message = msg;
  }

  parseCommand() {
    const { command } = parseMessageToCommand(this.message);
    if (["goy", "cuck", "fidalgo"].includes(command))
      this.my_type_level(command);
    else if (command == "destiny")
      this.timerTo("final da season de Destiny", "2021-02-10T17:00:00.000Z");
    else if (command == "cyberpunk")
      this.timerTo("lançamento do Cyberpunk", "2020-12-10T00:00:00.000Z");
  }

  my_type_level(type) {
    this.repository.db.getUser(this.message.author.id).then((result) => {
      const dateChanged =
        type === "cuck"
          ? result.cuckChangedDate
          : type === "goy"
          ? result.goyChangedDate
          : result.fidalgoChangedDate;

      const currentValue =
        type === "cuck"
          ? result.cuckValue
          : type === "goy"
          ? result.goyValue
          : result.fidalgoValue;

      const now = new Date().toJSON().slice(0, 10);

      var value;
      if (dateChanged == null || now > dateChanged.toJSON().slice(0, 10)) {
        value = Math.random() * 100;
        value = parseFloat(value.toFixed(2));
      } else {
        value = currentValue;
      }

      this.repository.db.users
        .findOne({ userId: this.message.author.id })
        .then(async (user) => {
          if (!user) {
            console.log("error");
            return;
          }

          if (type === "cuck") {
            user.cuckValue = value;
            user.cuckChangedDate = now;
          } else if (type === "goy") {
            user.goyValue = value;
            user.goyChangedDate = now;
          } else if (type === "fidalgo") {
            user.fidalgoValue = value;
            user.fidalgoChangedDate = now;
          }
          user.save();
        });

      this.message.channel.send(
        createSuccessEmbed(
          `Você está ${value}% ${type}! <:56781042_811112372584549_2847201:575829560285986816> hoje!`
        )
          .setTitle(this.message.author.username)
          .setThumbnail(this.message.author.avatarURL())
      );
    });
  }

  timerTo(msg, date) {
    var _time;
    var _success;

    timediff(new Date(), date, function (result) {
      let field = function (value, str) {
        if (str == "mês") {
          return value > 1
            ? `${value} meses`
            : value > 0
            ? `${value} ${str}`
            : "";
        }
        return value > 1
          ? `${value} ${str}s`
          : value > 0
          ? `${value} ${str}`
          : "";
      };

      let test = Object.values(result).every((elem) => elem <= 0);

      var timesMsg = "Tempo expirado";

      if (!test) {
        let days = field(result["days"], "dia");
        let months = field(result["months"], "mês");
        let hours = field(result["hours"], "hora");
        let minutes = field(result["minutes"], "minuto");
        let seconds = field(result["seconds"], "segundo");

        let times = [];

        if (months.length > 0) times.push(months);
        if (days.length > 0) times.push(days);
        if (hours.length > 0) times.push(hours);
        if (minutes.length > 0) times.push(minutes);
        if (seconds.length > 0) times.push(seconds);

        var success = !test;
        if (times.length > 2) {
          timesMsg = times.slice(0, times.length - 1).join(", ");
          timesMsg += ` e ${times[times.length - 1]}`;
        } else if (times.length > 1) {
          timesMsg = `${times[0]} e ${times[1]}`;
        } else {
          timesMsg = times[0];
        }
        _time = timesMsg;
        _success = success;
      } else {
        _time = timesMsg;
        _success = success;
      }
    });

    if (_success) {
      return this.message.channel.send(
        createSuccessEmbed(`Tempo até o ${msg}: \`${_time}\``)
      );
    } else {
      return this.message.channel.send(createErrorEmbed(_time));
    }
  }
}
