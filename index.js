import { Client } from "discord.js";
import {
  BOT_TOKEN,
  PREFIX,
  RANK_COMMANDS,
  FUNNY_COMMANDS,
  MUSIC_COMMANDS,
  ADMIN_COMMANDS,
  TWITCH_COMMANDS,
} from "./config.js";
import { createSuccessEmbed, parseMessageToCommand } from "./utils.js";
import { Rank } from "./commands/rank.js";
import { Funny } from "./commands/funny.js";
import { Music } from "./commands/music.js";
import { XpManager } from "./core/xp_manager.js";
import { TwitchListener } from "./core/twitch_listener.js";
import { Filters } from "./core/filters.js";
import { Admin } from "./commands/admin.js";
import { Lives } from "./commands/lives.js";
import { DataBase } from "./db/client.js";

const client = new Client({ disableMentions: "none" });

const onTurnOnLive = (liveChannel, streamName, streamUrl, streamPreview) => {
  const channel = client.channels.cache.find(
    (channel) => channel.id === liveChannel
  );
  channel.send(
    createSuccessEmbed(
      `@everyone ${streamName} is now \`online\`\n${streamUrl}`
    )
      .setImage(streamPreview)
      .setTitle("Live notification")
  );
};
const onTurnOffLive = (liveChannel, streamName) => {
  const channel = client.channels.cache.find(
    (channel) => channel.id === liveChannel
  );
  channel.send(
    createSuccessEmbed(`${streamName} is now \`offline\``).setTitle(
      "Live notification"
    )
  );
};

let repository;
let twListener;
let admin;

client.on("ready", () => {
  console.clear();

  const db = new DataBase();
  repository = new XpManager(db);
  twListener = new TwitchListener(db, onTurnOnLive, onTurnOffLive);
  admin = new Admin(repository);
  client.user.setPresence({
    activity: {
      name: "\\help",
      type: "LISTENING",
    },
    status: "online",
  });

  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async function (message) {
  if (new Filters(message).parseMessage()) {
    return;
  }

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
    } else if (TWITCH_COMMANDS.includes(command)) {
      new Lives(message, twListener).parseCommand();
    }
  } else {
    // repository.manageXp(message);
  }
});

client.once("reconnecting", () => {
  console.log("Reconnecting!");
});
client.once("disconnect", () => {
  console.log("Disconnect!");
});

client.login(BOT_TOKEN);
