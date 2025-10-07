from pydantic import BaseModel, Field


class LlmMcq(BaseModel):
    question: str
    options: list[str]
    answer: str


class TranscriptionDoc(BaseModel):
    user_id: str | None = None
    title: str | None = None
    audio_file_path: str
    transcribed_content: str
    mcqs: list[LlmMcq] = Field(default_factory=list)


class TranscriptionListEntryUI(BaseModel):
    doc_id: str
    title: str


class LlmMcqResponse(BaseModel):
    mcqs: list[LlmMcq]


class UserDoc(BaseModel):
    display_name: str
    score: int


class UserDocWithId(UserDoc):
    user_id: str
