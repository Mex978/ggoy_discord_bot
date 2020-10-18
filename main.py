from models import User
import discord
import config
import consts
import render_banner
import traceback
import random

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
    if message.author == client.user or message.author.bot:
        return

    user_id = message.author.id
    if message.content == cmd("level"):
        try:
            _users = User.select().where(User.user_id == user_id)
            if _users:
                _user = _users[0]
                # _file = render_banner.run(message.author.avatar_url, _user.xp_needed, message.author.name, _user.level, _user.xp)
                embedMessage = discord.Embed(
                    color=0x00ff00,
                    title=f"Goy Card - {message.author.name}",
                    desciption=""
                )
                _user_roles = [role.name for role in message.author.roles if role.name != '@everyone']
                _user_roles = " | ".join(_user_roles)

                embedMessage.set_thumbnail(url=message.author.avatar_url)
                embedMessage.add_field(name="Role(s)", value=f"```{_user_roles}```", inline=False)
                embedMessage.add_field(name="Level", value=f"```{_user.level}```", inline=True)
                embedMessage.add_field(name="XP", value=f"```{_user.xp:.2f}/{_user.xp_needed:.2f}```", inline=True)

                await message.channel.send(embed=embedMessage)
            else:
                User.create(
                    user_id=user_id,
                    level=1,
                    xp=0.0,
                    xp_needed=consts.INITIAL_XP_NEEDED,
                )
                await message.channel.send(f"<@{user_id}> não estava cadastrado, mas agora pode subir de nível!")
        except Exception as error:
            print(traceback.print_exc())
            
            await message.channel.send(f"Error:\n```{error}```")
    elif message.content == cmd("rank"):

        await message.channel.send("rank command!")
    elif message.content.startswith(cmd("play ")):
        _arg = message.content.split(" ", 1)[1].strip()

        await message.channel.send(_arg)
    elif message.content == cmd("cuck"):
        goy_percent_pre = random.randint(0, 100)
        goy_percent_pos = random.randint(0, 9)

        await message.channel.send(f"<@{user_id}> é {goy_percent_pre}.{goy_percent_pos}% cuck! <:56781042_811112372584549_2847201:575829560285986816>")
    elif message.content == cmd("goy"):
        goy_percent_pre = random.randint(0, 100)
        goy_percent_pos = random.randint(0, 9)

        await message.channel.send(f"<@{user_id}> é {goy_percent_pre}.{goy_percent_pos}% goy! <:56781042_811112372584549_2847201:575829560285986816>")
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
