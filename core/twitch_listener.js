import https from "https";
import { DataBase } from "../db/client.js";
import axios from "axios";

export class TwitchListener {
  constructor(
    database = new DataBase(),
    onTurnOnLive = new Function(),
    onTurnOffLive = new Function(),
    liveChannel
  ) {
    this.liveChannel = liveChannel;
    this.onTurnOffLive = onTurnOffLive;
    this.onTurnOnLive = onTurnOnLive;
    this.baseUrl = "https://api.twitch.tv/kraken";
    this.clientId = process.env.CLIENT_ID;
    this.headers = {
      headers: {
        Accept: "application/vnd.twitchtv.v5+json",
        "Client-ID": this.clientId,
      },
    };
    this.db = database;
    this.init();
  }

  async init() {
    await this.loadChannels();
    this._initListener();
  }

  async loadChannels() {
    const tempLives = await this.db.lives.findAll();
    this.lives = [];

    tempLives.forEach((live) => {
      this.lives.push({
        name: live.getDataValue("channelName"),
        id: live.getDataValue("channelId"),
        inLive: false,
      });
    });
  }

  changeChannelState(channel, value) {
    const index = this.lives.indexOf(channel);
    this.lives[index].inLive = value;
  }

  _initListener() {
    setInterval(async () => {
      for (const live of this.lives) {
        await this.getChannelStatus(live);
      }
    }, 5000);
  }

  getChannelId(channelName) {
    return new Promise((resolve, reject) => {
      https
        .get(
          `${this.baseUrl}/users?login=${channelName}`,
          this.headers,
          (resp) => {
            resp.on("data", async (body) => {
              const users = JSON.parse(body).users;

              if (users && users.length > 0) {
                const channelId = users[0]._id;
                const channelName = users[0].name;
                const [model, created] = await this.db.lives.findOrCreate({
                  where: { channelId: channelId },
                  defaults: {
                    channelName: channelName,
                    channelId: channelId,
                  },
                });
                if (created == false) {
                  resolve(null);
                } else {
                  this.lives.push({
                    name: model.get("channelName"),
                    id: model.get("channelId"),
                    inLive: false,
                  });
                  resolve(true);
                }
              } else {
                resolve(false);
              }
            });
          }
        )
        .on("error", (err) => {
          console.log("Error: " + err.message);
          reject(err);
        });
    });
  }

  getChannelStatus = (channel) =>
    new Promise((resolve, reject) => {
      const liveChannel = this.liveChannel;

      axios
        .get(`${this.baseUrl}/streams/${channel.id}`, this.headers)
        .then((response) => {
          const streamData = response.data;

          if (streamData == null || streamData.stream == null) {
            if (channel.inLive) {
              if (liveChannel) {
                this.changeChannelState(channel, false);
                this.onTurnOffLive(liveChannel, channel.name);
              }
            }
          } else {
            if (!channel.inLive) {
              if (liveChannel) {
                const streamName = streamData.stream.channel.display_name;
                const streamUrl = streamData.stream.channel.url;
                const streamPreview = streamData.stream.preview.large;
                this.changeChannelState(channel, true);
                this.onTurnOnLive(
                  liveChannel,
                  streamName,
                  streamUrl,
                  streamPreview
                );
              }
            }
          }
          resolve();
        })
        .catch(function (error) {
          console.log(error);
          reject(error);
        })
        .then(function () {});
    });
}
