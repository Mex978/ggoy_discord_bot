from models import User
import discord
import config
import consts
import traceback
import random
import youtube_dl
from youtube_search import YoutubeSearch
import json
import asyncio
import get_dominant_color

client = discord.Client()
config.create_table()

queue = {}


def cmd(str):
    return consts.PREFIX + str


def get_main_channel() -> discord.TextChannel:
    return client.guilds[0].text_channels[0]


@client.event
async def on_ready():
    print(f"We have logged in as {client.user}")


@client.event
async def on_message(message):
    global queue
    if message.author == client.user or message.author.bot:
        return

    user_id = message.author.id
    user_disc = message.author.discriminator

    _users = User.select().where(User.user_id == user_id)
    if not _users:
        _new_user = User.create(
            user_id=user_id,
            level=1,
            xp=0.0,
            xp_needed=consts.INITIAL_XP_NEEDED,
        )
        _users = [_new_user]

    else:
        caracteres = len(message.content) if len(message.content) <= 75 else 75
        _user = _users[0]
        _user.xp += caracteres * consts.XP_PER_CHARACTER

        if _user.xp >= (
            _user.xp_needed + (_user.xp_needed * consts.NEXT_LEVEL_XP_FACTOR)
        ):
            _user.xp = 0.0
            _user.level += 1
            await message.channel.send(
                f"<@{user_id}> subiu para o nível {_user.level}",
                allowed_mentions=discord.AllowedMentions(everyone=True),
            )

        _user.save()

    if message.content == cmd("level"):
        try:
            # if not _users:
            #     _msg = await message.channel.send(
            #         embed=discord.Embed(
            #             color=0xFF0000,
            #             description=f"<@{user_id}> não estava cadastrado, mas agora pode começar a subir de nível!",
            #         )
            #     )
            #     return

            _user = _users[0]

            _, dominant_color = get_dominant_color.run(message.author.avatar_url)
            dominant_color = discord.Color(value=int(dominant_color, 16))
            embedMessage = discord.Embed(
                color=discord.Color.from_rgb(*dominant_color.to_rgb()),
                title=f"Goy Card - {message.author.name} #{user_disc}",
                desciption="",
            )

            _user_roles = [
                role.name for role in message.author.roles if role.name != "@everyone"
            ]
            _user_roles = " | ".join(_user_roles) if _user_roles else "Sem roles"
            embedMessage.set_thumbnail(url=message.author.avatar_url)
            embedMessage.add_field(
                name="Level", value=f"```{_user.level}```", inline=True
            )
            embedMessage.add_field(
                name="XP",
                value=f"```{_user.xp:.2f}/{_user.xp_needed:.2f}```",
                inline=True,
            )
            embedMessage.add_field(
                name="Role(s)", value=f"```{_user_roles}```", inline=False
            )

            await message.channel.send(embed=embedMessage)
        except Exception as error:
            print(traceback.print_exc())

            await message.channel.send(f"Error:\n```{error}```")
    elif message.content == cmd("rank"):
        await message.channel.send("rank command!")
    elif message.content.startswith(cmd("volume")):
        if message.guild.voice_client is None:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description="No voice client available"
                )
            )
            return
        _arg = message.content[8:].strip()

        if not _arg:
            await message.channel.send(
                embed=discord.Embed(
                    description=f"Current volume is `{message.guild.voice_client.source.volume}`"
                )
            )
            return

        try:
            new_volume = float(_arg)
            if new_volume < 0.0 or new_volume > 1.0:
                raise Exception()
            message.guild.voice_client.source.volume = new_volume
            await message.channel.send(
                embed=discord.Embed(description=f"Changed volume to `{new_volume}`")
            )
        except Exception as error:
            print(error)
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000,
                    description="Invalid value. Try a value on range `0.0, 1.0`",
                )
            )
    elif message.content == (cmd("queue")):
        if message.guild.voice_client is not None:
            if queue["queue"]:
                _current = queue["current"]["name"]
                _queue_list = f"Currently playing\n\t `{_current}`\n\nNext:\n"
                _queue_list = "\n".join(
                    [
                        ("\t" + str(number + 1) + ". " + "`" + item["name"] + "`")
                        for number, item in enumerate(queue["queue"])
                    ]
                )
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00,
                        title="Queue",
                        description=f"{_queue_list}",
                    )
                )
            else:
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00,
                        description="Nothing in queue!",
                    )
                )
        else:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"GgoyBot not in voice channel!"
                )
            )
    elif message.content == (cmd("skip")):
        if message.guild.voice_client is not None:
            if message.guild.voice_client.is_playing():
                if queue["queue"]:
                    new_song = queue["queue"][0]["name"]
                    await message.channel.send(
                        embed=discord.Embed(
                            color=0x00FF00,
                            description=f"Song skipped! Now playing `{new_song}`",
                        )
                    )
                else:
                    await message.channel.send(
                        embed=discord.Embed(
                            color=0x00FF00,
                            description="Song skipped! Nothing in queue!",
                        )
                    )
                message.guild.voice_client.stop()
            else:
                await message.channel.send(
                    embed=discord.Embed(color=0xFF0000, description="Nothing playing!")
                )
        else:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"GgoyBot not in voice channel!"
                )
            )
    elif message.content == (cmd("pause")):
        if message.guild.voice_client is not None:
            if message.guild.voice_client.is_playing():
                message.guild.voice_client.pause()

            else:
                await message.channel.send(
                    embed=discord.Embed(ccolor=0xFF0000, description="Nothing playing!")
                )
        else:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"GgoyBot not in voice channel!"
                )
            )
    elif message.content == (cmd("resume")):
        if message.guild.voice_client is not None:
            message.guild.voice_client.resume()
        else:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"GgoyBot not in voice channel!"
                )
            )
    elif message.content == (cmd("playing")):
        if message.guild.voice_client is not None:
            if message.guild.voice_client.is_playing():
                current_song = queue["current"]["name"]
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00, description=f"Playing `{current_song}`!"
                    )
                )
            else:
                await message.channel.send(
                    embed=discord.Embed(color=0xFF0000, description="Nothing playing!")
                )
        else:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"GGoyBot not in voice channel!"
                )
            )

    elif message.content.startswith(cmd("play ")):

        def check_queue():
            if queue.get("queue", None):
                next_song = queue["queue"].pop(0)
                queue["current"] = next_song

                message.guild.voice_client.play(
                    discord.FFmpegPCMAudio(next_song["url"], **FFMPEG_OPTIONS),
                    after=lambda e: check_queue(),
                )
                # message.guild.voice_client.source = discord.PCMVolumeTransformer(
                #     message.guild.voice_client.source
                # )

        _arg = message.content.split(" ", 1)[1].strip()

        if (
            message.guild.voice_client is not None
            and message.guild.voice_client.is_playing()
        ):
            ydl_opts = {
                "format": "beataudio/best",
                "quiet": True,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
            searchingMessage = await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00, description=f"**Searching** `{_arg}`..."
                )
            )

            yt = YoutubeSearch(_arg, max_results=1).to_json()
            yt_id = str(json.loads(yt)["videos"][0]["id"])
            yt_url = "https://www.youtube.com/watch?v=" + yt_id
            with youtube_dl.YoutubeDL(ydl_opts) as ydl:
                song_info = ydl.extract_info(yt_url, download=False)
                songname = song_info.get("title", None)

                if not queue.get("queue", None):
                    queue["queue"] = []

                queue["queue"].append(
                    {"name": songname, "url": song_info["formats"][0]["url"]}
                )

                await searchingMessage.delete()
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00, description=f"**Queued** `{songname}`"
                    )
                )

            return
        if message.author.voice is None:
            await message.channel.send(
                embed=discord.Embed(
                     color=0xFF0000, description=f"You need to be connected on a voice channel!"
                 )
            )
            return
        _voice_client = message.author.voice.channel

        if message.guild.voice_client is None:
            await message.guild.change_voice_state(
                channel=message.channel, self_deaf=True, self_mute=False
            )
            await _voice_client.connect()

        FFMPEG_OPTIONS = {
            "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
            "options": "-vn",
        }

        ydl_opts = {
            "format": "beataudio/best",
            "quiet": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
        }
        searchingMessage = await message.channel.send(
            embed=discord.Embed(
                color=0x00FF00, description=f"**Searching** `{_arg}`..."
            )
        )
        yt = YoutubeSearch(_arg, max_results=1).to_json()
        yt_id = str(json.loads(yt)["videos"][0]["id"])
        yt_url = "https://www.youtube.com/watch?v=" + yt_id
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            song_info = ydl.extract_info(yt_url, download=False)
            songname = song_info.get("title", None)

            if queue is None or queue.get("current", None) is None:
                queue = {"current": {}, "queue": []}
            queue["current"]["name"] = songname
            queue["current"]["url"] = song_info["formats"][0]["url"]

            message.guild.voice_client.play(
                discord.FFmpegPCMAudio(
                    song_info["formats"][0]["url"], **FFMPEG_OPTIONS
                ),
                after=lambda e: check_queue(),
            )
            message.guild.voice_client.source = discord.PCMVolumeTransformer(
                message.guild.voice_client.source
            )
            message.guild.voice_client.source.volume = 0.5

            await searchingMessage.delete()
            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00, description=f"**Playing** `{songname}`"
                )
            )

    elif message.content == cmd("stop"):
        _voice_client = message.guild.voice_client
        if _voice_client.is_connected():
            if queue:
                queue.clear()
            await _voice_client.disconnect()

    elif message.content == cmd("cuck"):
        goy_percent_pre = random.randint(0, 100)
        goy_percent_pos = random.randint(0, 9)

        await message.channel.send(
            f"<@{user_id}> é {goy_percent_pre}.{goy_percent_pos}% cuck! <:56781042_811112372584549_2847201:575829560285986816>"
        )
    elif message.content == cmd("goy"):
        goy_percent_pre = random.randint(0, 100)
        goy_percent_pos = random.randint(0, 9)

        await message.channel.send(
            f"<@{user_id}> é {goy_percent_pre}.{goy_percent_pos}% goy! <:56781042_811112372584549_2847201:575829560285986816>"
        )
    elif message.content.startswith(cmd("")):
        await message.channel.send("Comando não encontrado :frowning:")


client.run(consts.ENV["SECRET_KEY"])
