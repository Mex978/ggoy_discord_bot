from models import User
import discord
import config
import consts


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

    if message.content == cmd("level"):
        try:
            _users = User.select().where(User.user_id == message.author.id)
            if _users:
                await message.channel.send(
                    f"<@{message.author.id}> está no level {_users[0].level}"
                )
            else:
                User.create(
                    user_id=message.author.id,
                    level=1,
                    xp=0.0,
                    xp_needed=consts.INITIAL_XP_NEEDED,
                )
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
         _users = User.select().where(User.user_id == message.author.id)
        if not _users:
            User.create(user_id=message.author.id, level=1, xp=0.0)
        else:
            _user =_users[0]
            _user.xp += len(message.content) * consts.XP_PER_CHARACTER

            if _user.xp >= (
                _user.xp_needed + (_user.xp_needed * consts.NEXT_LEVEL_XP_FACTOR)
            ):
                _user.xp = 0.0
                _user.level += 1
                await message.channel.send(
                    f"<@{message.author.id}> subiu para o nível {_user.level}",
                    allowed_mentions=AllowedMentions(everyone=True),
                )

            _user.save()


client.run(consts.ENV["SECRET_KEY"])
