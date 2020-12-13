import {
  parseMessageToCommand,
  createErrorEmbed,
  createSuccessEmbed,
} from "./../utils.js";
import { Message, MessageEmbed } from "discord.js";
import { queue, VOLUME } from "./../config.js";
import ytdl from "ytdl-core";
import { XpManager } from "./../core/xp_manager.js";
import yts from "yt-search";

export class Music {
  constructor(msg, repo) {
    this.initialVolume = VOLUME;

    this.repository = new XpManager();
    Object.assign(this.repository, repo);

    this.message = new Message();
    Object.assign(this.message, msg);
  }

  parseCommand() {
    const { command, arg } = parseMessageToCommand(this.message);

    const serverQueue = queue.get(this.message.guild.id);

    if (command == "play") {
      if (arg === "") {
        return;
      }
      this.execute(serverQueue);
      return;
    } else if (command == "skip") {
      this.skip(serverQueue);
      return;
    } else if (command == "stop") {
      this.stop(serverQueue);
      return;
    } else if (command == "volume") {
      this.volume(serverQueue);
      return;
    } else if (command == "loop") {
      this.loop(serverQueue);
      return;
    } else if (command == "queue") {
      this.queue(serverQueue);
      return;
    } else if (command == "playing") {
      this.playing(serverQueue);
      return;
    } else if (command == "pause") {
      this.pause(serverQueue);
      return;
    } else if (command == "resume") {
      this.resume(serverQueue);
      return;
    } else {
      this.message.channel.send("You need to enter a valid command!");
    }
  }

  pause(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed("You have to be in a voice channel to do this!")
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("There is no song that I could pause!")
      );

    serverQueue.connection.dispatcher.pause();
    return this.message.channel.send(createSuccessEmbed("Song paused!"));
  }

  resume(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed("You have to be in a voice channel to do this!")
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("There is no song that I could resume!")
      );

    if (serverQueue.connection.dispatcher.paused) {
      serverQueue.connection.dispatcher.resume();
      return this.message.channel.send(createSuccessEmbed("Song resumed!"));
    } else {
      return this.message.channel.send(createErrorEmbed("Nothing to resume!"));
    }
  }

  playing(serverQueue) {
    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("GgoyBot not in voice channel!")
      );

    if (serverQueue.songs) {
      let title = serverQueue.songs[0].title;
      let duration = serverQueue.songs[0].duration;
      let loopMessage =
        serverQueue.loop == -1
          ? " - On looping"
          : serverQueue.loop > 0
          ? ` - On loop for ${serverQueue.loop} more time(s)`
          : "";

      return this.message.channel.send(
        createSuccessEmbed(
          `Playing \`${title}\` - \`${duration}\`${loopMessage}!`
        )
      );
    } else {
      return this.message.channel.send(createSuccessEmbed("Nothing playing!"));
    }
  }

  queue(serverQueue) {
    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("GgoyBot not in voice channel!")
      );

    if (serverQueue.songs && serverQueue.songs.length > 1) {
      let title = serverQueue.songs[0].title;
      let duration = serverQueue.songs[0].duration;
      let loopMessage =
        serverQueue.loop == -1
          ? " - On looping"
          : serverQueue.loop > 0
          ? ` - On loop for ${serverQueue.loop} more time(s)`
          : "";
      let queueList = `Currently playing\n\t \`${title}\` - \`${duration}\`${loopMessage}\n\nNext:\n`;
      for (const [index, element] of serverQueue.songs.slice(1).entries()) {
        queueList += `\t${index + 1}. \`${element.title}\` - \`${
          element.duration
        }\``;
        console.log(index, element);
      }
      return this.message.channel.send(
        new MessageEmbed()
          .setTitle("Queue")
          .setColor("#00ff00")
          .setDescription(`${queueList}`)
      );
    } else {
      return this.message.channel.send(createSuccessEmbed("Nothing in queue!"));
    }
  }

  skip(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed("You have to be in a voice channel to stop the music!")
      );
    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("There is no song that I could skip!")
      );
    serverQueue.loop = 0;
    serverQueue.connection.dispatcher.end();
  }

  stop(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed("You have to be in a voice channel to stop the music!")
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(createErrorEmbed("No song playing!"));

    serverQueue.songs = [];
    serverQueue.voiceChannel.leave();
    serverQueue = null;
  }

  volume(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed("You have to be in a voice channel to change volume!")
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(
        createErrorEmbed("There is no song that I could skip!")
      );

    const newVolume = parseFloat(this.message.content.split(" ")[1]);

    if (!Number.isNaN(newVolume)) {
      const dispatcher = serverQueue.connection.dispatcher;
      serverQueue.volume = newVolume;
      dispatcher.setVolume(serverQueue.volume);
    } else {
      return this.message.channel.send(
        createErrorEmbed(`Current volume \`${serverQueue.volume}\``)
      );
    }
  }

  loop(serverQueue) {
    if (!this.message.member.voice.channel)
      return this.message.channel.send(
        createErrorEmbed(
          "You have to be in a voice channel to change lopp setting!"
        )
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    )
      return this.message.channel.send(createErrorEmbed("No song playing!"));

    const newLoop = parseInt(this.message.content.split(" ")[1]);

    if (!Number.isNaN(newLoop)) {
      serverQueue.loop = newLoop;
      return this.message.channel.send(
        createErrorEmbed(
          `Loop setting changed to \`${
            serverQueue.loop == -1 ? "infinity" : serverQueue.loop
          }\``
        )
      );
    } else {
      return this.message.channel.send(
        createErrorEmbed(
          `Current loop setting \`${
            serverQueue.loop == -1 ? "infinity" : serverQueue.loop
          }\``
        )
      );
    }
  }

  play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.voiceChannel.leave();
      queue.delete(guild.id);
      return;
    }

    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        if (serverQueue.loop == 0) {
          serverQueue.songs.shift();
        } else if (serverQueue.loop == -1) {
          serverQueue.songs.unshift(serverQueue.songs.shift());
        } else {
          serverQueue.loop--;
          serverQueue.songs.unshift(serverQueue.songs.shift());
        }

        this.play(guild, serverQueue.songs[0]);
      })
      .on("error", (error) => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume);
    serverQueue.textChannel.send(
      createSuccessEmbed(`Start playing: **${song.title}**`)
    );
  }

  execute(serverQueue) {
    const args = this.message.content.split(" ");
    const song_name = args.slice(1).join(" ");

    const voiceChannel = this.message.member.voice.channel;
    if (!voiceChannel)
      return this.message.channel.send(
        createErrorEmbed("You need to be in a voice channel to play music!")
      );

    if (
      !serverQueue ||
      !serverQueue.connection ||
      !serverQueue.connection.dispatcher
    ) {
      // Creating the contract for our queue
      const queueContruct = {
        textChannel: this.message.channel,
        voiceChannel: voiceChannel,
        connection: null,
        songs: [],
        volume: this.initialVolume,
        playing: false,
        loop: 0, // 0 no loop | -1 infinity loops | (1, 2, 3...) number of times
      };
      // Setting the queue using our contract
      queue.set(this.message.guild.id, queueContruct);

      try {
        // Here we try to join the voicechat and save our connection into our object.
        voiceChannel.join().then((connection) => {
          queueContruct.connection = connection;
        });
      } catch (err) {
        // Printing the error message if the bot fails to join the voicechat
        console.log(err);
        queue.delete(this.message.guild.id);
        return this.message.channel.send(err);
      }
    }

    this.message.channel
      .send(createSuccessEmbed(`**Searching** \`${song_name}\`...`))
      .then((searcingMessage) => {
        yts(song_name)
          .then((result) => {
            if (result && result.videos.length > 0) {
              const serverQueue = queue.get(this.message.guild.id);
              const videos = result.videos[0];

              ytdl.getInfo(videos.videoId).then((songInfo) => {
                let duration = parseInt(songInfo.videoDetails.lengthSeconds);
                duration = `${Math.floor(duration / 60)
                  .toString()
                  .padStart(2, "0")}:${(duration % 60)
                  .toString()
                  .padEnd(2, "0")}`;

                const song = {
                  title: songInfo.videoDetails.title,
                  url: songInfo.videoDetails.video_url,
                  duration: duration,
                };

                // Pushing the song to our songs array
                serverQueue.songs.push(song);

                if (!serverQueue.playing) {
                  searcingMessage.delete();
                  serverQueue.playing = true;
                  // Calling the play function to start a song
                  this.play(this.message.guild, serverQueue.songs[0]);
                } else {
                  return this.message.channel.send(
                    createSuccessEmbed(
                      `\`${song.title}\` has been added to the queue!`
                    )
                  );
                }
              });
            } else {
              searcingMessage.delete();
              this.message.channel.send(
                createSuccessEmbed("Song not found :(")
              );
            }
          })
          .catch((e) => {
            console.log(e);
            searcingMessage.delete();
            this.message.channel.send(createSuccessEmbed("Song not found :("));
          });
      });
  }
}
