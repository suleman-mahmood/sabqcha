from pydantic import BaseModel

from api.models.user_models import UserRole


class Room(BaseModel):
    id: str
    display_name: str
    invite_code: str


class ListRoomsResponse(BaseModel):
    user_role: UserRole
    user_display_name: str
    rooms: list[Room]
