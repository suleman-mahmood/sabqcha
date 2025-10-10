import os
import random
import base58
import secrets
from loguru import logger

import yt_dlp


def internal_id(size: int = 16) -> str:
    return base58.b58encode(secrets.token_bytes(size)).decode()


def invite_code() -> str:
    code = internal_id()[:8].lower()
    code = code.replace("0", "a")
    code = code.replace("o", "b")
    return f"{code[:4]}-{code[-4:]}"


def download_youtube_audio_temp(url: str, temp_dir: str) -> str:
    logger.info("Downloading audio from url: {}", url)

    output_path = os.path.join(temp_dir, "%(title)s.%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": output_path,
        "quiet": True,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
        "proxy": "http://31.59.20.176:6754",
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url)
        filename = ydl.prepare_filename(info)

        # Replace extension with .mp3 if postprocessor changed it
        audio_file = os.path.splitext(filename)[0] + ".mp3"

    logger.info("Downloaded to audio file: {}", audio_file)

    return audio_file


_CUTE_NAMES = [
    "SunnyPaws",
    "BunnyHug",
    "CocoBean",
    "TinyCloud",
    "MoonPebble",
    "LunaBerry",
    "MochiBear",
    "PuddleDuck",
    "SnuggleFox",
    "CherryBlossom",
    "DaisySpark",
    "PebbleHeart",
    "PumpkinMuffin",
    "TwinkleStar",
    "BobaPop",
    "CloudyBun",
    "Marshmallow",
    "HoneySprout",
    "CinnamonPuff",
    "StarryMoo",
    "PebbleBoo",
    "LemonDrop",
    "SnowyWhisker",
    "BerryBloom",
    "CupcakeDream",
    "FluffyPine",
    "SparkleBug",
    "VelvetLeaf",
    "SnugBug",
    "ToffeeTwist",
    "CottonBean",
    "Bluebell",
    "Buttercup",
    "MuffinPop",
    "PandaSprout",
    "DreamyFawn",
    "CookieMoon",
    "MintyCloud",
    "TinyDew",
    "LunaBoo",
    "CuddleBear",
    "BobaBean",
    "Twinkie",
    "PuffNoodle",
    "PetalSpark",
    "MapleMuffin",
    "GlimmerCub",
    "SundaeBun",
    "JellyPuff",
    "CocoaNib",
    "CherryMoo",
    "PixiePop",
    "FluffMuff",
    "Snickerdoodle",
    "LilSprig",
    "SunnyBean",
    "PlumPuff",
    "LunaCup",
    "MintyMoo",
    "ButterBean",
    "CloverCub",
    "HoneyBerry",
    "PeachyPop",
    "NoodleBug",
    "MoonDrop",
    "BiscuitBear",
    "ToffeeBun",
    "ChocoChip",
    "SnuggleMuff",
    "CocoaSprout",
    "SprinkleFawn",
    "TwinkleBean",
    "TinySprout",
    "CherryPuff",
    "BubbleCub",
    "FluffyStar",
    "PumpkinPop",
    "DaisyDrop",
    "FuzzyMoo",
    "PebbleMuff",
    "HoneyPop",
    "LilClover",
    "BerryBean",
    "CottonCub",
    "SugarPuff",
    "MoonBun",
    "SunnyMuff",
    "VelvetPuff",
    "MochiMoo",
    "CookieBean",
    "DreamyCub",
    "StarSprout",
    "BubbleMuff",
    "SnugCub",
    "MintyStar",
    "TinyMuff",
    "HoneyClover",
    "LemonBun",
    "PumpkinStar",
    "CherryCub",
    "TwinkleBun",
]


def get_random_display_name() -> str:
    return random.choice(_CUTE_NAMES)
