import https from "https";
import { DataBase } from "../db/client.js";

export class TwitchListener {
  constructor(
    database = new DataBase(),
    onTurnOnLive = new Function(),
    onTurnOffLive = new Function()
  ) {
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

  changeChannelState(channel) {
    const index = this.lives.indexOf(channel);
    this.lives[index].inLive = !this.lives[index].inLive;
  }

  _initListener() {
    setInterval(() => {
      this.lives.forEach((live) => {
        this.getChannelStatus(live);
      });
    }, 1000);
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

  getChannelStatus(channel) {
    return new Promise((resolve, reject) => {
      let data = "";
      https
        .get(`${this.baseUrl}/streams/${channel.id}`, this.headers, (resp) => {
          resp.on("data", (body) => {
            data += body;
          });

          resp.on("end", () => {
            const streamData = JSON.parse(data);

            if (streamData == null || streamData.stream == null) {
              if (channel.inLive) {
                this.onTurnOffLive(channel.name);
                this.changeChannelState(channel);
              }
              resolve(null);
            } else {
              if (!channel.inLive) {
                const streamName = streamData.stream.channel.display_name;
                const streamUrl = streamData.stream.channel.url;
                const streamPreview = streamData.stream.preview.large;
                this.onTurnOnLive(streamName, streamUrl, streamPreview);
                this.changeChannelState(channel);
              }
              resolve(true);
            }
          });
        })
        .on("error", (err) => {
          console.log("Error: " + err.message);
          reject(err);
        });
    });
  }
}
