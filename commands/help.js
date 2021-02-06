import { Message } from "discord.js";
import { createSuccessEmbed } from "./../utils.js";

export class Help {
  static showHelp(msg = new Message()) {
    msg.channel.send(
      createSuccessEmbed("Commands available")
        .setTitle("Help")
        .addField(
          "RANK",
          `    \`\\level\`
                Mostra o seu goy card`
        )
        .addField(
          "FUNNY",
          `\`\\goy\`
        Mostra uma porcentagem do quão goy você está
    
        \`\\cuck\`
        Mostra uma porcentagem do quão cuck você está
    
        \`\\fidalgo\`
        Mostra uma porcentagem do quão fidalgo você está`
        )
        .addField(
          "MUSIC",
          `\`\\play [Nome para pesquisar]\`
        Toca a música que foi passada por parametro, se e somente se, for encontrada XD
    
        \`\\loop ou \\loop [numero de vezes]\`
        Deixa a música que está tocando atualmente em loop infinitas vezes no primeiro caso ou um número específico de vezes no segundo
    
        \`\\skip\`
        Pula a música atual, se alguma estiver tocando
    
        \`\\stop\`
        Para todas as músicas
        
        \`\\playing\`
        Mostra o nome da música que está tocando, se esta existir
    
        \`\\volume\`
        Exibe o volume atual do bot de música
    
        \`\\volume [valor entre 0.0 e 1.0]\`
        Ajusta o volume do bot de música
    
        \`\\queue\`
        Mostra a fila de músicas a serem reproduzidas`
        )
        .addField(
          "TWITCH LISTENER",
          `\`\\live [canal_1 canal_2 ...]\`
        Adiciona o(s) canal(is) para que sejam observados e uma notificação quando estiver online seja enviada pelo bot
    
        \`\\listenHere\`
        Configura o canal de texto atual para receber as notificações de lives`
        )
        .addField(
          "ADMIN",
          `\`\\setXp [@fulano_de_tal] [quantidade_de_xp]\`
        Dá a um usuário uma quantidade de xp`
        )
    );
  }
}
