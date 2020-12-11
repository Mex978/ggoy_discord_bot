import { Client } from "discord.js";
import {
  BOT_TOKEN,
  PREFIX,
  RANK_COMMANDS,
  FUNNY_COMMANDS,
  MUSIC_COMMANDS,
  ADMIN_COMMANDS,
} from "./config.js";
import { parseMessageToCommand } from "./utils.js";
import { Rank } from "./commands/rank.js";
import { Funny } from "./commands/funny.js";
import { Music } from "./commands/music.js";
import { Repository } from "./core/xp_manager.js";
import { Filters } from "./core/filters.js";
import { Admin } from "./commands/admin.js";

const repository = new Repository();
const client = new Client();
const admin = new Admin(repository);

client.on("ready", () => {
  console.clear();
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async function (message) {
  if (new Filters(message).parseMessage()) {
    return;
  }

  console.log(message.content);

  if (message.content.startsWith(PREFIX)) {
    const { command } = parseMessageToCommand(message);

    if (ADMIN_COMMANDS.includes(command)) {
      admin.parseCommand(message);
    } else if (RANK_COMMANDS.includes(command)) {
      new Rank(message, repository).parseCommand();
    } else if (MUSIC_COMMANDS.includes(command)) {
      new Music(message, repository).parseCommand();
    } else if (FUNNY_COMMANDS.includes(command)) {
      new Funny(message, repository).parseCommand();
    }
  } else {
    repository.manageXp(message);
  }
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});
client.once("disconnect", () => {
  console.log("Disconnect!");
});

repository.init().then((_) => {
  client.login(BOT_TOKEN);
});
