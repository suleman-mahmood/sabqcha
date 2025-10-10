from pydantic import BaseModel


class Lecture(BaseModel):
    id: str
    room_id: str
    file_path: str
    title: str
    transcribed_content: str | None
