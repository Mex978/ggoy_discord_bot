import * as fs from "fs";

// Main
export const PREFIX = "\\";

// Environment Variables
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const MONGODB_URL = process.env.MONGODB_URL;

// Telegram Listener
export const LISTENED_CHANNELS = {
  1106104333: {
    name: "Promoções de Jogos",
    channel: "809190128815570984",
  },
  // 1396715327: {
  //   name: "Canal Qualquer",
  //   channel: "809190128815570984",
  // },
  1194851971: {
    name: "GGoy Teste",
    channel: "505840665062670337",
  },
};
export const API_ID = process.env.API_ID;
export const API_HASH = process.env.API_HASH;

// Music Feature
let data = fs.readFileSync("./fonts/GinesoSoft-ConReg.ttf");

export const INITIAL_VOLUME = 50;
export const RANK_COMMANDS = ["level", "rank"];
export const CUSTOM_FONT = data.toString("base64");

// Rank Feature
export const NEXT_LEVEL_XP_FACTOR = 0.75;
export const INITIAL_XP_NEEDED = 22.0;
export const XP_PER_CHARACTER = 0.2;

//Commands
export const FUNNY_COMMANDS = [
  "goy",
  "cuck",
  "fidalgo",
  "destiny",
  "cyberpunk",
];
export const MUSIC_COMMANDS = [
  "p",
  "pl",
  "play",
  "playlist",
  "skip",
  "volume",
  "stop",
  "loop",
  "playing",
  "queue",
  "repeatQueue",
  "pause",
  "resume",
];
export const TWITCH_COMMANDS = ["live", "listenHere"];
export const ADMIN_COMMANDS = ["setxp"];
