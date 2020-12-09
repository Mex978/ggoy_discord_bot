console.clear();
import { Client } from "discord.js";
import {
  BOT_TOKEN,
  PREFIX,
  RANK_COMMANDS,
  FUNNY_COMMANDS,
  MUSIC_COMMANDS,
} from "./config.js";
import { parseMessageToCommand } from "./utils.js";
import { Rank } from "./commands/rank.js";
import { Funny } from "./commands/funny.js";
import { Music } from "./commands/music.js";
import { Repository } from "./core/xp_manager.js";
import { Filters } from "./core/filters.js";

const repository = new Repository();
const client = new Client();

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async function (message) {
  if (new Filters(message).parseMessage()) {
    return;
  }

  if (message.content.startsWith(PREFIX)) {
    const { command } = parseMessageToCommand(message);

    if (RANK_COMMANDS.includes(command)) {
      new Rank(message, repository).parseCommand();
    } else if (MUSIC_COMMANDS.includes(command)) {
      new Music(message, repository).parseCommand();
    } else if (FUNNY_COMMANDS.includes(command)) {
      new Funny(message).parseCommand();
    }
  }

  repository.manageXp(message);
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
