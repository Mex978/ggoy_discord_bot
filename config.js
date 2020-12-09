import * as fs from "fs";

let data = fs.readFileSync("./fonts/GinesoSoft-ConReg.ttf");

export const VOLUME = 0.5;
export const queue = new Map();
export const CUSTOM_FONT = data.toString("base64");
export const BOT_TOKEN = process.env.BOT_TOKEN;
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
  "play",
  "skip",
  "volume",
  "stop",
  "loop",
  "playing",
  "queue",
  // "pause",
  // "resume",
];
export const NEXT_LEVEL_XP_FACTOR = 1.75;
export const INITIAL_XP_NEEDED = 22.0;
export const XP_PER_CHARACTER = 0.2;
