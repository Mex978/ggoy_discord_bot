import { Message } from "discord.js";
import { createSuccessEmbed, parseMessageToCommand } from "./../utils.js";

export class Help {
  static showHelp(msg = new Message()) {
    const { arg } = parseMessageToCommand(msg);

    switch (arg) {
      case "music":
        return msg.channel.send(
          createSuccessEmbed(
            "Comandos disponíveis para gerenciamento de música"
          )
            .setTitle("Music")
            .addField(
              "(\\play | \\p) [Nome para pesquisar ou link (Youtube | Spotify)]",
              "Toca a música que foi passada por parametro, se e somente se, for encontrada XD"
            )
            .addField(
              "(\\playlist | \\pl) [link para a playlist no YouTube]",
              "Toca a música que foi passada por parametro, se e somente se, for encontrada XD"
            )
            .addField(
              "\\loop",
              "Deixa a música que está tocando atualmente em loop infinitas vezes"
            )
            .addField(
              "\\repeatQueue",
              "Deixa a queue que está tocando atualmente em loop infinitas vezes"
            )
            .addField(
              "\\skip",
              "Pula a música atual, se alguma estiver tocando"
            )
            .addField(
              "\\pause",
              "Pausa a música atual, se alguma estiver tocando"
            )
            .addField("resume", "Resume a música pausada, se esta \\existir")
            .addField("stop", "Para todas as músicas")
            .addField(
              "\\playing",
              "Mostra o nome da música que está tocando, se esta existir"
            )
            .addField(
              "\\volume",
              "Exibe o volume atual do bot de música se este estiver tocando"
            )
            .addField(
              "\\volume [valor entre 0 e 100]",
              "Ajusta o volume do bot de música em porcentagem (Mas pode passar do limite hehe)"
            )
            .addField(
              "\\queue",
              "Mostra a fila de músicas a serem reproduzidas"
            )
        );

      case "rank":
        return msg.channel.send(
          createSuccessEmbed("Comandos disponíveis para rank")
            .setTitle("Rank")
            .addField("\\level", "Mostra o seu goy card")
        );
      case "funny":
        return msg.channel.send(
          createSuccessEmbed("Comandos funny disponíveis")
            .setTitle("Funny")
            .addField("\\goy", "Mostra uma porcentagem do quão goy você está")
            .addField("\\cuck", "Mostra uma porcentagem do quão cuck você está")
            .addField(
              "\\fidalgo",
              "Mostra uma porcentagem do quão fidalgo você está"
            )
        );
      case "admin":
        return msg.channel.send(
          createSuccessEmbed("Comandos disponíveis para admin")
            .setTitle("Admin")
            .addField(
              "\\setXp [@fulano_de_tal] [quantidade_de_xp]",
              "Mostra uma porcentagem do quão goy você está"
            )
        );
      default:
        return msg.channel.send(
          createSuccessEmbed("Comandos disponíveis")
            .setTitle("Help")
            .addField("\\help rank", "Mostra os comandos de **Rank**")
            .addField("\\help funny", "Mostra os comandos **Divertidos**")
            .addField("\\help music", "Mostra os comandos de **Música**")
            .addField("\\help admin", "Mostra os comandos de **Administrador**")
        );
    }
  }
}
