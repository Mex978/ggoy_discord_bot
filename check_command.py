class GgoyCommands:
    def __init__(self, prefix="$"):
        self.prefix = prefix

    def new_command(self, command, function):
        if message.content == self.prefix + command:
            function()
