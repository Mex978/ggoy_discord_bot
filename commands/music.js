import {
  parseMessageToCommand,
  createErrorEmbed,
  createSuccessEmbed,
  require,
} from "./../utils.js";
import { Message, MessageEmbed } from "discord.js";
const { Player } = require("discord-music-player");

export class Music {
  constructor(p = new Player()) {
    this.player = p;
  }

  _eventsQueue(message = new Message()) {
    this.player
      .getQueue(message.guild.id)
      .on("end", () => {
        console.log("end event");
        message.channel.send(
          createErrorEmbed("The queue is empty, there is nothing to play!")
        );
      })
      .on(
        "songChanged",
        (oldSong, newSong, skipped, repeatMode, repeatQueue) => {
          if (skipped) {
            console.log("songChanged event");
            message.channel.send(
              createSuccessEmbed(
                `[${oldSong.name}](${oldSong.url}) skipped! Now playing [${newSong.name}](${newSong.url})!`
              )
            );
          } else if (repeatMode) {
            message.channel.send(
              createSuccessEmbed(
                `Playing [${newSong.name}](${newSong.url}) again...`
              )
            );
          } else if (repeatQueue) {
            message.channel.send(
              createSuccessEmbed(
                `Playing [${newSong.name}](${newSong.url})...\nAdded [${oldSong.name}](${oldSong.url}) to the end of the queue (repeatQueue).`
              )
            );
          } else {
            message.channel.send(
              createSuccessEmbed(
                `Now playing [${newSong.name}](${newSong.url})...`
              )
            );
          }
        }
      )
      .on("channelEmpty", () => {
        console.log("channelEmpty event");
        message.channel.send(
          createErrorEmbed("Everyone left the Voice Channel.")
        );
      })
      .on("songError", (errMessage, song) => {
        console.log("songError event");
        if (errMessage === "VideoUnavailable")
          message.channel.send(
            createErrorEmbed(
              `Could not play [${song.name}](${song.url}) - The song was Unavailable, skipping...`
            )
          );
        else
          message.channel.send(
            createErrorEmbed(
              `Could not play [${song.name}](${song.url}) - ${errMessage}.`
            )
          );
      });
  }

  parseCommand(message = new Message()) {
    const { command, arg } = parseMessageToCommand(message);

    if (
      command == "play" ||
      command == "p" ||
      command == "playlist" ||
      command == "pl"
    ) {
      if (arg === "") {
        return;
      }

      command == "play" || command == "p"
        ? this.play(message)
        : this.playlist(message);
    } else if (command == "playlist") {
      if (arg === "") {
        return;
      }

      this.playlist(message);
    } else if (command == "skip") {
      this.skip(message);
      return;
    } else if (command == "stop") {
      this.stop(message);
      return;
    } else if (command == "volume") {
      this.volume(message);
      return;
    } else if (command == "loop") {
      this.loop(message);
      return;
    } else if (command == "queue") {
      this.queue(message);
      return;
    } else if (command == "repeatQueue") {
      this.repeatQueue(message);
      return;
    } else if (command == "playing") {
      this.playing(message);
      return;
    } else if (command == "pause") {
      this.pause(message);
      return;
    } else if (command == "resume") {
      this.resume(message);
      return;
    }
  }

  play(message = new Message()) {
    const args = message.content.split(" ");
    const song_name = args.slice(1).join(" ");

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (isPlaying) {
      this.player
        .addToQueue(message.guild.id, song_name)
        .then((callback) => {
          if (callback.error) throw callback.error;
          let song = callback.song;

          return message.channel.send(
            createSuccessEmbed(
              `Song [${song.name}](${song.url}) was added to the queue! - <@${message.author.id}>`
            )
          );
        })
        .catch((_) => {
          return message.channel.send(
            createErrorEmbed(`No Song found with that query.`)
          );
        });
    } else {
      this.player
        .play(message.member.voice.channel, song_name)
        .then((callback) => {
          if (callback.error) throw callback.error;
          let song = callback.song;

          message.channel.send(
            createSuccessEmbed(
              `Start playing: [${song.name}](${song.url}) - <@${message.author.id}>`
            )
          );

          this._eventsQueue(message);
        })
        .catch((err) => {
          console.log(err);
          return message.channel.send(
            createErrorEmbed(`No Song found with that query.`)
          );
        });
    }
  }

  playlist(message = new Message()) {
    const args = message.content.split(" ");
    const playlistLink = args.slice(1).join(" ");

    let isPlaying = this.player.isPlaying(message.guild.id);
    // If MaxSongs is -1, will be infinite.
    this.player
      .playlist(
        message.guild.id,
        playlistLink,
        message.member.voice.channel,
        20,
        message.author.tag
      )
      .then((playlist) => {
        // Determine the Song (only if the music was not playing previously)
        let song = playlist.song;
        // Get the Playlist
        playlist = playlist.playlist;

        // Send information about adding the Playlist to the Queue
        message.channel.send(
          createSuccessEmbed(
            `Added a Playlist to the queue with **${playlist.videoCount} songs**, that was **made by ${playlist.channel}**.`
          )
        );

        // If there was no songs previously playing, send a message about playing one.
        if (!isPlaying) {
          message.channel.send(
            createSuccessEmbed(
              `Start playing: [${song.name}](${song.url}) - <@${message.author.id}>`
            )
          );
          this._eventsQueue(message);
        }
      });
  }

  pause(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed("You have to be in a voice channel to do this!")
      );

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(
        createErrorEmbed("There is no song that I could pause!")
      );

    this.player.pause(message.guild.id);
    return message.channel.send(createSuccessEmbed("Song paused!"));
  }

  resume(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed("You have to be in a voice channel to do this!")
      );

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(
        createErrorEmbed("There is no song that i could resume!")
      );

    this.player.resume(message.guild.id);
    return message.channel.send(createSuccessEmbed("Song resumed!"));
  }

  playing(message = new Message()) {
    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(createErrorEmbed("Nothing playing!"));

    let song = this.player.nowPlaying(message.guild.id);
    return message.channel.send(
      createSuccessEmbed(
        `Playing [${song.name}](${song.url}) - \`${song.duration}\`!`
      )
    );
  }

  queue(message = new Message()) {
    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(createErrorEmbed("Nothing playing!"));

    let songs = this.player.getQueue(message.guild.id).songs;

    if (songs && songs.length > 1) {
      let title = songs[0].name;
      let duration = songs[0].duration;

      let queueList = `Currently playing\n\t \`${title}\` - \`${duration}\`\n\nNext:\n`;
      for (const [index, element] of songs.slice(1).entries()) {
        queueList += `\t${index + 1}. \`${element.name}\` - \`${
          element.duration
        }\`\n`;
      }
      return message.channel.send(
        new MessageEmbed()
          .setTitle("Queue")
          .setColor("#00ff00")
          .setDescription(`${queueList}`)
      );
    } else {
      return message.channel.send(createSuccessEmbed("Nothing in queue!"));
    }
  }

  skip(message = new Message()) {
    let isPlaying = this.player.isPlaying(message.guild.id);

    if (isPlaying) this.player.skip(message.guild.id);
    else {
      return message.channel.send(
        createErrorEmbed("There is no song that I could skip!")
      );
    }
  }

  stop(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed("You have to be in a voice channel to stop the music!")
      );

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (isPlaying) {
      this.player.stop(message.guild.id);
      message.channel.send(
        createSuccessEmbed("Music stopped, the Queue was cleared!")
      );
    } else {
      return message.channel.send(createErrorEmbed("No song playing!"));
    }
  }

  volume(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed("You have to be in a voice channel to change volume!")
      );

    const newVolume = parseInt(message.content.split(" ")[1]);

    if (!Number.isNaN(newVolume)) {
      this.player.setVolume(message.guild.id, newVolume);

      return message.channel.send(
        createErrorEmbed(`Volume changed to \`${newVolume}\``)
      );
    } else {
      let queue = this.player.getQueue(message.guild.id);
      if (queue)
        return message.channel.send(
          createErrorEmbed(`Current volume \`${queue.volume}\``)
        );
    }
  }

  loop(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed(
          "You have to be in a voice channel to change lopp setting!"
        )
      );

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(createErrorEmbed("No song playing!"));

    let toggle = this.player.toggleLoop(message.guild.id);

    // Send a message with the toggle information
    if (toggle)
      message.channel.send(
        createSuccessEmbed("I will now repeat the current playing song.")
      );
    else
      message.channel.send(
        createSuccessEmbed("I will not longer repeat the current playing song.")
      );
  }

  repeatQueue(message = new Message()) {
    if (!message.member.voice.channel)
      return message.channel.send(
        createErrorEmbed(
          "You have to be in a voice channel to change lopp setting!"
        )
      );

    let isPlaying = this.player.isPlaying(message.guild.id);

    if (!isPlaying)
      return message.channel.send(createErrorEmbed("No song playing!"));

    let repeatQueueStatus = this.player.getQueue(message.guild.id).repeatQueue;
    this.player.setQueueRepeatMode(message.guild.id, !repeatQueueStatus);

    if (!repeatQueueStatus) {
      message.channel.send(
        createSuccessEmbed(`Full queue will be repeated indefinitely!`)
      );
    } else {
      message.channel.send(
        createSuccessEmbed(
          `Full queue will no longer be repeated indefinitely!`
        )
      );
    }
  }
}
