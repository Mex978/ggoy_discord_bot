import * as fs from "fs";

let data = fs.readFileSync("./fonts/GinesoSoft-ConReg.ttf");

export const INITIAL_VOLUME = 50;
export const CUSTOM_FONT = data.toString("base64");
export const BOT_TOKEN = process.env.BOT_TOKEN;
export const MONGODB_URL = process.env.MONGODB_URL;
export const PREFIX = "\\";
export const RANK_COMMANDS = ["level", "rank"];
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
export const NEXT_LEVEL_XP_FACTOR = 0.75;
export const INITIAL_XP_NEEDED = 22.0;
export const XP_PER_CHARACTER = 0.2;
