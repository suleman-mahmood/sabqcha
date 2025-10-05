from pydantic import BaseModel


class TranscriptionDoc(BaseModel):
    audio_file_path: str
    transcribed_content: str
