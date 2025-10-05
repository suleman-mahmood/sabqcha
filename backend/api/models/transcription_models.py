from pydantic import BaseModel


class TranscriptionDoc(BaseModel):
    audio_file_path: str
    transcribed_content: str


class LlmMcq(BaseModel):
    question: str
    options: list[str]
    answer: str


class LlmMcqResponse(BaseModel):
    mcqs: list[LlmMcq]
