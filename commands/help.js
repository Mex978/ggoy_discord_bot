import { createSuccessEmbed } from "./../utils.js";

export class Help {
  static showHelp() {
    return createSuccessEmbed(`
    \`\\level\`
    Mostra o seu goy card

    \`\\goy\`
    Mostra uma porcentagem do quão goy você é

    \`\\cuck\`
    Mostra uma porcentagem do quão cuck você é

    \`\\play [Nome para pesquisar]\`
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
    Mostra a fila de músicas a serem reproduzidas
    `).setTitle("Help");
  }
}
