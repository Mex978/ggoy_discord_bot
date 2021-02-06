import { Message, MessageEmbed } from "discord.js";
import { PREFIX } from "./config.js";

import { createRequire } from "module";
export const require = createRequire(import.meta.url);

export const createErrorEmbed = (content) =>
  new MessageEmbed().setColor("#ff0000").setDescription(content);

export const createSuccessEmbed = (content) =>
  new MessageEmbed().setColor("#00FF00").setDescription(content);

export const parseMessageToCommand = (message = new Message()) => {
  const commandBody = message.content.slice(PREFIX.length);
  const args = commandBody.split(" ");
  const arg = args.slice(1).join(" ");
  const command = args.shift();

  return { command, arg };
};

export const getCardHtml = (
  name,
  discriminator,
  main_role,
  current_level,
  current_xp,
  target_xp,
  // rank,
  base_64_font
) => {
  function numberToKNotation(num) {
    const numInSciNot = {};
    [numInSciNot.coefficient, numInSciNot.exponent] = num
      .toExponential(1)
      .split("e")
      .map((item) => Number(item));

    const kCount = Math.floor(numInSciNot.exponent / 3);
    const auxMultiplier = 10 ** (numInSciNot.exponent % 3);

    return kCount > 0
      ? `${(numInSciNot.coefficient * auxMultiplier).toFixed(1)} ${"K".repeat(
          kCount
        )}`
      : `${num.toFixed(1)}`;
  }

  const currentXp = numberToKNotation(current_xp);
  const targetXp = numberToKNotation(target_xp);

  return `
<!DOCTYPE html>
  <html lang="pt">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      :root {
        --background_bar: #AB342E;
        --bar: #FE5F5B;
        --neon: #79D5C8;
        --background: #161616;
        --principal: #212121;
        --bar_percentage: ${((current_xp / target_xp) * 100).toFixed(1)}%;
      }

      @font-face {
        font-family: "GinesoSoft";
        src: url("data:application/font-woff;charset=utf-8;base64,${base_64_font}");
      }

      body {
        margin: 0;
        padding: 0;
        background-color: #transparent;
        background-color: var(--background);
        font-family: "GinesoSoft";

      }

      .ex_container {
        background-color: var(--principal);
        border-radius: 3px;
        border: 2px solid var(--neon);
        padding: 25px;
      }

      .avatar {
        width: 100%;
        height: 100%;
        background-image: var(--avatar_url);
        background-size: cover;
        border-radius: 50%;
        border: 2px solid var(--neon);
      }

      .info_container {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .bar {
        width: var(--bar_percentage);
        height: 30px;
        background-color: var(--bar);
      }

      .external_bar {
        height: 30px;
        clip-path: polygon(100% 0, 100% 40%, 98% 100%, 0 100%, 0 100%, 0 0);
        background-color: var(--background_bar);
        width: 100%;
      }

      .current_xp {
        color: var(--bar);
        padding-left: 10px;
        padding-right: 0px;
        padding-top: 40px;
        font-size: 30px;
        white-space: nowrap;
      }

      .target_xp {
        color: var(--background_bar);
        padding-left: 10px;
        padding-right: 3px;
        font-size: 40px;
        white-space: nowrap;
      }

      .level_container {
        background-color: var(--neon);
        padding: 4px;
        clip-path: polygon(0 0, 100% 0, 100% 50%, 100% 98%, 30% 100%, 0 70%);
      }

      .level_container_inner {
        justify-content: center;
        display: table-cell;
        vertical-align: middle;
        font-size: 48px;
        clip-path: polygon(0 0, 100% 0, 100% 50%, 100% 98%, 30% 100%, 0 70%);
        color: var(--neon);
        text-align: center;
        align-items: center;
        align-content: center;
        height: 100px;
        min-height: 100px;
        min-width: 100px;
        width: 100px;
        background-color: #212121;

      }

      .divider {
        color: var(--neon);
        transform: rotate(-20deg);
        padding-top: 15px;
        font-size: 40px;
      }

      .main_container {
        padding: 15px;
      }

      .name_and_bar {
        margin-left: 15px;
        width: 100%;
      }
  
      .name {
        font-size: 32px;
        color: white;
        padding-bottom: 5px;
      }
    </style>
    <script> var global = global || window; var Buffer = Buffer || []; var process = process || { env: { DEBUG: undefined }, version: [] }; </script>
  </head>

  <body>
    <div class="main_container">
      <div class="ex_container">
        <div class="info_container">
          <div class="level_container">
            <div class="level_container_inner">
              ${current_level}
            </div>
          </div>

          <div class="name_and_bar">
            <div class="name">${name} #${discriminator}</div>
            <div class="external_bar">
              <div class="bar" ;"></div>
            </div>
            <div style="color: var(--neon);font-size: 20px;">${main_role}</div>
          </div>
          <div class="current_xp">
            ${currentXp}
          </div>
          <div class="divider">\\</div>
          <div class="target_xp">
            ${targetXp}
          </div>
        </div>
      </div>
    </div>
  </body>

</html>
`;
};

// .rank {
//   position: absolute;
//   right: 30px;
//   top: 20px;
//   align-items: end;
//   color: white;
//   font-size: 32px;
// }

{
  /* <div class="rank">#${rank}</div> */
}
