import discord
import consts


client = discord.Client()


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
        await message.channel.send("level command!")
    elif message.content == cmd("rank"):
        await message.channel.send("rank command!")
    elif message.content.startswith(cmd("play ")):
        _arg = message.content.split(" ", 1)[1].strip()
        await message.channel.send(_arg)
    elif message.content.startswith(cmd("")):
        await message.channel.send("Comando não encontrado :frowning:")


client.run(consts.ENV["SECRET_KEY"])
