import os
import base58
import secrets
from loguru import logger

import yt_dlp


def internal_id(size: int = 16) -> str:
    return base58.b58encode(secrets.token_bytes(size)).decode()


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
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url)
        filename = ydl.prepare_filename(info)

        # Replace extension with .mp3 if postprocessor changed it
        audio_file = os.path.splitext(filename)[0] + ".mp3"

    logger.info("Downloaded to audio file: {}", audio_file)

    return audio_file
