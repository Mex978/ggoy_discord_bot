import { Client } from "discord.js";

import {
  BOT_TOKEN,
  PREFIX,
  RANK_COMMANDS,
  FUNNY_COMMANDS,
  MUSIC_COMMANDS,
  ADMIN_COMMANDS,
  TWITCH_COMMANDS,
  INITIAL_VOLUME,
  LISTENED_CHANNELS,
} from "./config.js";
import {
  createSuccessEmbed,
  // createErrorEmbed,
  // createSuccessEmbed,
  parseMessageToCommand,
  require,
} from "./utils.js";
import { Rank } from "./commands/rank.js";
import { Funny } from "./commands/funny.js";
import { Music } from "./commands/music.js";
import { XpManager } from "./core/xp_manager.js";
// import { TwitchListener } from "./core/twitch_listener.js";
import { Filters } from "./core/filters.js";
import { Admin } from "./commands/admin.js";
// import { Lives } from "./commands/lives.js";
import { DataBase } from "./db/client.js";
import { Help } from "./commands/help.js";
const { Player } = require("discord-music-player");
import { TelegramListener } from "./core/telegram_listener.js";
const express = require("express");

const app = express();
const port = 3000;

app.get("/", (_, res) => res.send("Hello World!"));

app.listen(port, () => console.log(`GGoyBot at listening to port ${port}`));

const client = new Client({ disableMentions: "none" });
const player = new Player(client, {
  leaveOnEnd: true,
  leaveOnStop: false,
  leaveOnEmpty: true,
  timeout: 60,
  volume: INITIAL_VOLUME,
  quality: "high",
});

process.env.TZ = "America/Sao_Paulo";

client.player = player;
let musicHandler = new Music(player);

// const onTurnOnLive = (liveChannel, streamName, streamUrl, streamPreview) => {
//   const channel = client.channels.cache.find(
//     (channel) => channel.id === liveChannel
//   );
//   channel.send(
//     createSuccessEmbed(
//       `@everyone ${streamName} is now \`online\`\n${streamUrl}`
//     )
//       .setImage(streamPreview)
//       .setTitle("Live notification")
//   );
// };
// const onTurnOffLive = (liveChannel, streamName) => {
//   const channel = client.channels.cache.find(
//     (channel) => channel.id === liveChannel
//   );
//   channel.send(
//     createSuccessEmbed(`${streamName} is now \`offline\``).setTitle(
//       "Live notification"
//     )
//   );
// };

let repository;
let twListener;
let admin;

client.on("ready", () => {
  // console.clear();

  const tL = new TelegramListener((updates) => {
    const newChannelMessages = updates
      .filter((update) => {
        if (update._ === "updateNewChannelMessage") {
          console.log(update);

          if (update.message.post) {
            if (update.message.peer_id.channel_id in LISTENED_CHANNELS) {
              console.log("--------------------------------------");
              console.log(update);
              console.log("--------------------------------------");
              return update.message;
            }
          }
        }
      })
      .map(({ message }) => message);

    for (const message of newChannelMessages) {
      console.log(LISTENED_CHANNELS[message.peer_id.channel_id]);

      client.channels
        .fetch(LISTENED_CHANNELS[message.peer_id.channel_id].channel)
        .then((channel) => {
          channel.send(
            createSuccessEmbed(`@everyone ${message.message}`).setTitle(
              LISTENED_CHANNELS[message.peer_id.channel_id].name
            )
          );
        });
    }
  });

  tL.init();

  const db = new DataBase();
  repository = new XpManager(db);
  // twListener = new TwitchListener(db, onTurnOnLive, onTurnOffLive);
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
      musicHandler.parseCommand(message);
    } else if (FUNNY_COMMANDS.includes(command)) {
      new Funny(message, repository).parseCommand();
    } else if (TWITCH_COMMANDS.includes(command)) {
      // new Lives(message, twListener).parseCommand();
    } else if (command == "help") {
      Help.showHelp(message);
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

client.login(BOT_TOKEN);
