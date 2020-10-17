from models import User
import discord
import config
import consts
import render_banner

client = discord.Client()
config.create_table()


def cmd(str):
    return consts.PREFIX + str


def get_main_channel() -> discord.TextChannel:
    return client.guilds[0].text_channels[0]


@client.event
async def on_ready():
    print(f"We have logged in as {client.user}")


@client.event
async def on_message(message):
    if message.author == client.user:
        return

    user_id = message.author.id

    if message.content == cmd("level"):
        try:
            _users = User.select().where(User.user_id == user_id)
            if _users:
                _user = _users[0]
                _file = render_banner.run(message.author.avatar_url, _user.xp_needed, message.author.name, _user.level, _user.xp)
                await message.channel.send(
                    # f"<@{user_id}> está no level " +
                    # f"{_users[0].level} com {_users[0].xp:.2f} de xp",
                    file=_file,
                )
            else:
                User.create(
                    user_id=user_id,
                    level=1,
                    xp=0.0,
                    xp_needed=consts.INITIAL_XP_NEEDED,
                )
                await message.channel.send(f"<@{user_id}> não estava cadastrado, mas agora pode subir de nível!")
        except Exception as error:
            await message.channel.send(f"Error:\n```{error}```")
    elif message.content == cmd("rank"):
        await message.channel.send("rank command!")
    elif message.content.startswith(cmd("play ")):
        _arg = message.content.split(" ", 1)[1].strip()
        await message.channel.send(_arg)
    elif message.content.startswith(cmd("")):
        await message.channel.send("Comando não encontrado :frowning:")
    else:
        _users = User.select().where(User.user_id == user_id)
        if not _users:
            User.create(
                user_id=user_id,
                level=1,
                xp=0.0,
                xp_needed=consts.INITIAL_XP_NEEDED,
            )
        else:
            caracteres = len(message.content) if len(message.content) <= 75 else 75
            _user = _users[0]
            _user.xp += caracteres * consts.XP_PER_CHARACTER

            if _user.xp >= (
                _user.xp_needed +
                (_user.xp_needed * consts.NEXT_LEVEL_XP_FACTOR)
            ):
                _user.xp = 0.0
                _user.level += 1
                await message.channel.send(
                    f"<@{user_id}> subiu para o nível {_user.level}",
                    allowed_mentions=discord.AllowedMentions(everyone=True),
                )

            _user.save()


client.run(consts.ENV["SECRET_KEY"])
