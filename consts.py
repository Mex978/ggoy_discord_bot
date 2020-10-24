import pydotenv

ENV = pydotenv.Environment()
PREFIX = "\\"
NEXT_LEVEL_XP_FACTOR = 1.75
INITIAL_XP_NEEDED = 22.0
XP_PER_CHARACTER = 0.05
YDL_OPTIONS = {
    "format": "beataudio/best",
    "quiet": True,
    "source_address": "0.0.0.0",
    "postprocessors": [
        {
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }
    ],
}