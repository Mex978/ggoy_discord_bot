from models import User
import discord
import config
import consts
import traceback
import random
import youtube_dlc as youtube_dl
from youtubesearchpython import SearchVideos
import json
import asyncio
import get_dominant_color
import os
import ctypes
import ctypes.util
import datetime
from twitch import TwitchClient
from pathlib import Path
from threading import Thread
# import nest_asyncio


# nest_asyncio.apply()


client = discord.Client()
config.create_table()

twitch_listener_running = False
queue = {}
loop_times = -1
current_volume = 0.2

def extractUrl(song_url):
    for _ in range(3):
        try:
            with youtube_dl.YoutubeDL(consts.YDL_OPTIONS) as ydl:
                info_dict = ydl.extract_info(song_url, download=False)
                video_url = info_dict.get("url", None)
                video_title = info_dict.get('title', None)
                video_duration = info_dict.get("duration", None)
                if video_duration is not None:
                    video_duration = f"{str(video_duration//60).zfill(2)}:{str(video_duration%60).zfill(2)}"
                
                return video_title, video_url, video_duration
        except Exception as error:
            print(error)
            return None

async def twitch_listener():
    twitch_client = TwitchClient(client_id=consts.ENV["TWITCH_CLIENT_ID"])

    while True:
        existent_users = []
        if Path("./listened_lives.txt").is_file():
            _file = open("listened_lives.txt", "r")
            existent_users = _file.read().split(":")
            _file.close()

        if existent_users:
            for user_id in existent_users:
                stream = twitch_client.streams.get_stream_by_user(user_id)
                is_live = True if stream is not None else False
                if is_live:
                    # await client.get_channel(757390167995711488).send(f"{user_id} is live: {is_live}")
                    await client.get_channel(757390167995711488).send(
                        embed=discord.Embed(
                            color=discord.Color.from_rgb(*dominant_color.to_rgb()),
                            title=f"Live Advertisement - {stream_name}",
                            description=stream
                        )
                    )
                    stream_name = stream.get("display_name", None)
                    stream_url = stream.get("url", None)
                    stream_profile = stream.get("profile_banner", None)
                    stream_game = stream.get("game", None)


                    if stream_name is None or stream_url is None or stream_profile is None or stream_game is None:
                        continue

                    _, dominant_color = get_dominant_color.run(stream_url)
                    dominant_color = discord.Color(value=int(dominant_color, 16))
                    embed = discord.Embed(
                        color=discord.Color.from_rgb(*dominant_color.to_rgb()),
                        title=f"Live Advertisement - {stream_name}",
                    )
                    embed.set_image(url=stream_profile)
                    embed.add_field(
                        name="Stream URL", value=f"```{stream_url}```", inline=True
                    )
                    embed.add_field(
                        name="Game", value=f"```{stream_game}```", inline=True
                    )

                    await client.get_channel(757390167995711488).send(
                        embed=embed
                    )
                    print(is_live)


def cmd(str):
    return consts.PREFIX + str


def get_main_channel() -> discord.TextChannel:
    return client.guilds[0].text_channels[0]


@client.event
async def on_ready():
    global twitch_listener_running
    print(f"We have logged in as {client.user}")
    if not twitch_listener_running:
        twitch_listener_running = not twitch_listener_running
        # asyncio.Task(twitch_listener())

        # loop = asyncio.get_event_loop()
        # loop.create_task(twitch_listener())
        # Thread(target=loop.run_forever())


@client.event
async def on_message(message):
    global queue, current_volume, loop_times
    if message.author == client.user or message.author.bot:
        return

    _allowed_in_channel_test = ["0188", "6234"]
    if message.channel.name == "channel-test" and (message.author.discriminator not in _allowed_in_channel_test):
        _msg = await message.channel.send(
            embed=discord.Embed(
                color=0xFF0000,
                description="Only the Developer and GGoyBot can interact here",
            )
        )
        await asyncio.sleep(5)
        await _msg.delete()
        await message.delete()
        return
    elif message.channel.name == "channel-test" and (message.author.discriminator in _allowed_in_channel_test):
        pass
    elif message.content.startswith(cmd("")) and message.channel.name != "comandos-bot":
        _msg = await message.channel.send(
            embed=discord.Embed(
                color=0xFF0000,
                description="Commands not available in that text channel, please type in the `commandos-bot`",
            )
        )

        await asyncio.sleep(5)
        await _msg.delete()
        await message.delete()
        return
    elif (
        not message.content.startswith(cmd(""))
        and not message.content.startswith("!")
        and not message.content.startswith("-")
        and not message.content.startswith("_")
        and not message.content.startswith("/")
    ) and message.channel.name == "comandos-bot":
        _msg = await message.channel.send(
            embed=discord.Embed(
                color=0xFF0000,
                description="Only commands are available on this channel",
            )
        )

        await asyncio.sleep(5)
        await _msg.delete()
        await message.delete()
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
    # else: # Gain xp typing commands
    elif not message.content.startswith(cmd("")): # Gain xp typing not commands
        caracteres = len(message.content) if len(message.content) <= 75 else 75
        _user = _users[0]
        _user.xp += caracteres * consts.XP_PER_CHARACTER

        if _user.xp >= _user.xp_needed:
            _user.xp = 0.0
            _user.xp_needed += _user.xp_needed * consts.NEXT_LEVEL_XP_FACTOR
            _user.level += 1
            await message.channel.send(
                f"<@{user_id}> subiu para o nível {_user.level}",
                allowed_mentions=discord.AllowedMentions(everyone=True),
            )

        _user.save()

    if message.content == cmd("level"):
        try:
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
        await message.channel.send(
            embed=discord.Embed(
                color=0xFF0000,
                description="Coming soon",
            )
        )
        return

        try:
            _all_users = User.select()

            if not _all_users:
                await message.channel.send(
                    embed=discord.Embed(color=0xFF0000, description="No goys :(")
                )
                return

            embedMessage = discord.Embed(
                color=0x00FF00,
                title=f"Rank Goys",
                desciption="",
            )

            for index, _user in enumerate(_all_users):
                _user_roles = [
                    role.name
                    for role in message.author.roles
                    if role.name != "@everyone"
                ]
                _user_roles = " | ".join(_user_roles) if _user_roles else "Sem roles"

                embedMessage.add_field(
                    name=f"#{index + 1}",
                    value=f"```User: {message.guild.get_member(_user.user_id)}\nLevel: {_user.level}\nXP: {_user.xp:.2f}/{_user.xp_needed:.2f}\nRoles: {_user_roles}```",
                    inline=False,
                )

            await message.channel.send(embed=embedMessage)
        except Exception as error:
            print(traceback.print_exc())

            await message.channel.send(f"Error:\n```{error}```")
    elif message.content.startswith(cmd("loop")):
        _arg = message.content.split(" ", 1)
        if len(_arg) > 1:
            _arg = message.content.split(" ", 1)[1].strip()
        
            try:
                _arg = int(_arg)
                if _arg < 0:
                    raise Exception()
                loop_times = _arg
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00, description=f"Loop changed to {loop_times} time(s)"
                    )
                )
            except Exception:
                await message.channel.send(
                    embed=discord.Embed(
                        color=0xFF0000, description="Invalid value"
                    )
                )
            return

        loop_times = 0 if loop_times != 0 else -1
        await message.channel.send(
            embed=discord.Embed(
                color=0x00FF00, description=f"Loop option changed to `{False if loop_times == -1 else True}`"
            )
        )
        return
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
                    color=0x00FF00,
                    description=f"Current volume is `{message.guild.voice_client.source.volume}`",
                )
            )
            return

        try:
            new_volume = float(_arg)
            if new_volume < 0.0 or new_volume > 1.0:
                raise Exception()
            current_volume = new_volume
            message.guild.voice_client.source.volume = current_volume
            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00, description=f"Changed volume to `{new_volume}`"
                )
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
                _current_name = queue["current"]["name"]
                _current_duration = queue["current"]["duration"]
                _loop_msg = " - On looping" if loop_times == 0 else f" - On loop for {loop_times} more time(s)" if loop_times > 0 else ""
                _queue_list = f"Currently playing\n\t `{_current_name}` - `{_current_duration}`{_loop_msg}\n\nNext:\n"
                _queue_list += "\n".join(
                    [
                        (
                            "\t"
                            + str(number + 1)
                            + ". "
                            + "`"
                            + item["name"]
                            + "`"
                            + " - "
                            + "`"
                            + item["duration"]
                            + "`"
                        )
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
        loop_times = -1
        if message.guild.voice_client is not None:
            if message.guild.voice_client.is_playing():
                if queue["queue"]:
                    new_song_name = queue["queue"][0]["name"]
                    new_song_duration = queue["queue"][0]["duration"]
                    await message.channel.send(
                        embed=discord.Embed(
                            color=0x00FF00,
                            description=f"Song skipped! Now playing `{new_song_name}` - `{new_song_duration}`",
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
                current_song_name = queue["current"]["name"]
                _loop_msg = " - On looping" if loop_times == 0 else f" - On loop for {loop_times} more time(s)" if loop_times > 0 else ""
                current_song_duration = queue["current"]["duration"]
                await message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00,
                        description=f"Playing `{current_song_name}` - `{current_song_duration}`{_loop_msg}!",
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
    elif message.content == cmd("cyberpunkm"):

        def check_queue():
            global loop_times
            if queue.get("queue", None) or (queue.get("queue", None) is not None and loop_times != -1):
                if loop_times != -1:
                    if loop_times > 0:
                        if loop_times == 1:
                            loop_times = -1
                        else:
                            loop_times -= 1
                    message.guild.voice_client.play(
                        discord.FFmpegPCMAudio(
                            queue["current"]["url"], **FFMPEG_OPTIONS
                        ),
                        after=lambda e: check_queue(),
                    )
                    message.guild.voice_client.source = discord.PCMVolumeTransformer(
                        message.guild.voice_client.source
                    )
                    message.guild.voice_client.source.volume = current_volume
                    return
                next_song = queue["queue"].pop(0)
                new_song_name = next_song["name"]
                new_song_duration = next_song["duration"]
                queue["current"] = next_song
                coro = message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00,
                        description=f"Now playing `{new_song_name}` - `{new_song_duration}`",
                    )
                )
                fut = asyncio.run_coroutine_threadsafe(coro, client.loop)
                try:
                    fut.result()
                except:
                    # an error happened sending the message
                    pass

                message.guild.voice_client.play(
                    discord.FFmpegPCMAudio(next_song["url"], **FFMPEG_OPTIONS),
                    after=lambda e: check_queue(),
                )
                message.guild.voice_client.source = discord.PCMVolumeTransformer(
                    message.guild.voice_client.source
                )
                message.guild.voice_client.source.volume = current_volume
            else:
                _voice_client = message.guild.voice_client
                if _voice_client is not None and _voice_client.is_connected():
                    if queue:
                        queue.clear()
                    coro = _voice_client.disconnect()
                    fut = asyncio.run_coroutine_threadsafe(coro, client.loop)
                    try:
                        fut.result()
                    except:
                        # an error happened sending the message
                        pass

        if (
            message.guild.voice_client is not None
            and message.guild.voice_client.is_playing()
        ):
            _msg_priorizado = await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000, description=f"Cyberpunk priorizado, foi mal :("
                )
            )
            yt_url = "https://www.youtube.com/watch?v=mrZC1Jcv0dw"
            song_name, song_url, song_duration = extractUrl(yt_url)

            if not queue.get("queue", None):
                queue["queue"] = []

            queue["queue"].insert(0, queue["current"])
            queue["queue"].insert(
                0,
                {
                    "name": songname,
                    "url": song_info["formats"][0]["url"],
                    "duration": song_duration,
                },
            )
            message.guild.voice_client.stop()
            await _msg_priorizado.delete()
            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00,
                    description=f"**Playing** `{songname}` - `{song_duration}`",
                )
            )

            return
        if message.author.voice is None:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000,
                    description=f"You need to be connected on a voice channel!",
                )
            )
            return
        _voice_client = message.author.voice.channel

        if message.guild.voice_client is None:
            loop_times = -1
            await message.guild.change_voice_state(
                channel=message.channel, self_deaf=True, self_mute=False
            )
            await _voice_client.connect()

        FFMPEG_OPTIONS = {
            "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
            "options": "-vn",
        }

        yt_url = "https://www.youtube.com/watch?v=mrZC1Jcv0dw"
        with youtube_dl.YoutubeDL(consts.YDL_OPTIONS) as ydl:
            song_info = ydl.extract_info(yt_url, download=False)
            songname = song_info.get("title", None)
            song_duration = song_info.get("duration", None)
            if song_duration is not None:
                song_duration = f"{int(song_duration) // 60}:{int(song_duration) % 60}"

            if queue is None or queue.get("current", None) is None:
                queue = {"current": {}, "queue": []}
            queue["current"]["name"] = songname
            queue["current"]["duration"] = song_duration
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
            message.guild.voice_client.source.volume = current_volume

            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00,
                    description=f"**Playing** `{songname}` - `{song_duration}`",
                )
            )

    elif message.content.startswith(cmd("play ")):

        def check_queue():
            global loop_times
            if queue.get("queue", None) or (queue.get("queue", None) is not None and loop_times != -1):
                if loop_times != -1:
                    if loop_times > 0:
                        if loop_times == 1:
                            loop_times = -1
                        else:
                            loop_times -= 1
                    message.guild.voice_client.play(
                        discord.FFmpegPCMAudio(
                            queue["current"]["url"], **FFMPEG_OPTIONS
                        ),
                        after=lambda e: check_queue(),
                    )
                    message.guild.voice_client.source = discord.PCMVolumeTransformer(
                        message.guild.voice_client.source
                    )
                    message.guild.voice_client.source.volume = current_volume
                    return
                next_song = queue["queue"].pop(0)
                new_song_name = next_song["name"]
                new_song_duration = next_song["duration"]
                queue["current"] = next_song
                coro = message.channel.send(
                    embed=discord.Embed(
                        color=0x00FF00,
                        description=f"Now playing `{new_song_name}` - `{new_song_duration}`",
                    )
                )
                fut = asyncio.run_coroutine_threadsafe(coro, client.loop)
                try:
                    fut.result()
                except:
                    # an error happened sending the message
                    pass

                message.guild.voice_client.play(
                    discord.FFmpegPCMAudio(next_song["url"], **FFMPEG_OPTIONS),
                    after=lambda e: check_queue(),
                )
                message.guild.voice_client.source = discord.PCMVolumeTransformer(
                    message.guild.voice_client.source
                )
                message.guild.voice_client.source.volume = current_volume
            else:
                _voice_client = message.guild.voice_client
                if _voice_client is not None and _voice_client.is_connected():
                    if queue:
                        queue.clear()
                    coro = _voice_client.disconnect()
                    fut = asyncio.run_coroutine_threadsafe(coro, client.loop)
                    try:
                        fut.result()
                    except:
                        # an error happened sending the message
                        pass

        _arg = message.content.split(" ", 1)[1].strip()

        if (
            message.guild.voice_client is not None
            and message.guild.voice_client.is_playing()
        ):
            searchingMessage = await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00, description=f"**Searching** `{_arg}`..."
                )
            )
            _result = {}
            if _arg.startswith('http'):
                _result['link'] = _arg
            else:
                yt = SearchVideos(_arg, offset=1, mode="json", max_results=1)
                _result = json.loads(yt.result())["search_result"]
                if not _result:
                    await searchingMessage.delete()
                    await message.channel.send(
                        embed=discord.Embed(
                            color=0xFF0000,
                            description=f"Song not found :(",
                        )
                    )
                    return

                _result = _result[0]
            song_name, song_url, song_duration = extractUrl(_result["link"])
            if song_url is None:
                await message.channel.send(
                    embed=discord.Embed(
                        color=0xFF0000,
                        description=f"Error on play the song :(",
                    )
                ) 
                return
            if not queue.get("queue", None):
                queue["queue"] = []

            queue["queue"].append(
                {"name": song_name, "url": song_url, "duration": song_duration}
            )

            await searchingMessage.delete()
            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00,
                    description=f"**Queued** `{song_name}` - `{song_duration}`",
                )
            )
            return
        if message.author.voice is None:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000,
                    description=f"You need to be connected on a voice channel!",
                )
            )
            return
        _voice_client = message.author.voice.channel

        if message.guild.voice_client is None:
            loop_times = -1
            await message.guild.change_voice_state(
                channel=message.channel, self_deaf=True, self_mute=False
            )
            await _voice_client.connect()

        FFMPEG_OPTIONS = {
            "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
            "options": "-vn",
        }

        searchingMessage = await message.channel.send(
            embed=discord.Embed(
                color=0x00FF00, description=f"**Searching** `{_arg}`..."
            )
        )

        _result = {}
        if _arg.startswith('http'):
            _result['link'] = _arg
        else:
            yt = SearchVideos(_arg, offset=1, mode="json", max_results=1)
            _result = json.loads(yt.result())["search_result"]
            if not _result:
                await searchingMessage.delete()
                await message.channel.send(
                    embed=discord.Embed(
                        color=0xFF0000,
                        description=f"Song not found :(",
                    )
                )
                return

            _result = _result[0]
        song_name, song_url, song_duration = extractUrl(_result["link"])
        if song_url is None:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000,
                    description=f"Error on play the song :(",
                )
            ) 
            return

        if queue is None or queue.get("current", None) is None:
            queue = {"current": {}, "queue": []}

        queue["current"]["name"] = song_name
        queue["current"]["duration"] = song_duration
        queue["current"]["url"] = song_url

        message.guild.voice_client.play(
            discord.FFmpegPCMAudio(song_url, **FFMPEG_OPTIONS),
            after=lambda e: check_queue(),
        )
        message.guild.voice_client.source = discord.PCMVolumeTransformer(
            message.guild.voice_client.source
        )
        message.guild.voice_client.source.volume = current_volume

        await searchingMessage.delete()
        await message.channel.send(
            embed=discord.Embed(
                color=0x00FF00,
                description=f"**Playing** `{song_name}` - `{song_duration}`",
            )
        )
    elif message.content == cmd("stop"):
        _voice_client = message.guild.voice_client
        if _voice_client is not None and _voice_client.is_connected():
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
    elif message.content == cmd("destiny"):
        _to_cyberpunk = datetime.datetime(
            year=2020, month=11, day=10, hour=14, minute=0, second=0
        )

        _now = datetime.datetime.now()

        _remaining = _to_cyberpunk - _now

        days, seconds = _remaining.days, _remaining.seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60

        msg = f"Tempo até o lançamento da DLC do Destiny {(days)} dias, {hours} horas, {minutes} minutos e {seconds} segundos"
        await message.channel.send(msg)
    elif message.content == cmd("cyberpunk"):
        _to_cyberpunk = datetime.datetime(
            year=2020, month=12, day=10, hour=0, minute=1, second=0
        )

        _now = datetime.datetime.now()

        _remaining = _to_cyberpunk - _now

        days, seconds = _remaining.days, _remaining.seconds
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60

        msg = f"Tempo até o lançamento do cyberpunk {(days)} dias, {hours} horas, {minutes} minutos e {seconds} segundos"
        await message.channel.send(msg)
    elif message.content.startswith(cmd("live ")):
        existent_users = []
        _arg = message.content.split(" ", 1)[1].strip()
        if Path("./listened_lives.txt").is_file():
            _file = open("listened_lives.txt", "r")
            existent_users = _file.read().split(":")
            _file.close()
        channel = _arg

        twitch_client = TwitchClient(client_id=consts.ENV["TWITCH_CLIENT_ID"])
        channels = twitch_client.search.channels(channel, limit=1)
        if not channels:
            await message.channel.send(
                embed=discord.Embed(
                    color=0xFF0000,
                    description=f"Channel `{channel}` not found :(",
                )
            )
        else:
            display_name = channels[0]["display_name"]
            channel_id = str(channels[0]["id"])
            await message.channel.send(
                embed=discord.Embed(
                    color=0x00FF00,
                    description=f"Channel `{display_name}` has founded and added to be listened!",
                )
            )
            existent_users.append(channel_id)
        _file = open("listened_lives.txt", "w")
        _file.write(":".join(existent_users))
        _file.close()
    elif message.content == cmd("help"):
        _help = """
        `\level`
        Mostra o seu goy card

        `\\rank`
        Mostra o rank com todos os goys do servidor

        `\goy`
        Mostra uma porcentagem do quão goy você é

        `\cuck`
        Mostra uma porcentagem do quão cuck você é

        `\play [Nome para pesquisar]`
        Toca a música que foi passada por parametro, se e somente se, for encontrada XD

        `\skip`
        Pula a música atual, se alguma estiver tocando

        `\stop`
        Para todas as músicas
        
        `\playing`
        Mostra o nome da música que está tocando, se esta existir

        `\\volume`
        Exibe o volume atual do bot de música

        `\\volume [valor entre 0.0 e 1.0]`
        Ajusta o volume do bot de música

        `\queue`
        Mostra a fila de músicas a serem reproduzidas

        `\pause`
        Pausa a música atual, se alguma estiver tocando

        `\\resume`
        Continua a tocar uma música pausada anteriormente

        `\cyberpunkm`
        Toca a música do cyberpunk independente da fila

        `\cyberpunk`
        Mostra o tempo restante até o lançamento do cyberpunk
        """
        await message.channel.send(
            embed=discord.Embed(color=0x00FF00, description=_help)
        )
    elif message.content.startswith(cmd("")):
        await message.channel.send("Comando não encontrado :frowning:")


_key = consts.ENV.get("SECRET_KEY", None)
if _key is None:
    _key = os.getenv("SECRET_KEY")

client.run(_key)
