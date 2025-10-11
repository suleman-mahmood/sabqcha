from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from api.dependencies import DataContext, get_data_context
from api.dal import room_db
from api.models.user_models import UserRole
from api.dal import user_db
from api.models.room_models import ListRoomsResponse


router = APIRouter(prefix="/room")


class CreateRoomBody(BaseModel):
    display_name: str


@router.post("")
async def create_room(
    body: CreateRoomBody,
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.TEACHER

    await room_db.insert_room(data_context, body.display_name, data_context.user_id)


class JoinRoomBody(BaseModel):
    invite_code: str


@router.post("/join")
async def join_room(
    body: JoinRoomBody,
    data_context: DataContext = Depends(get_data_context),
):
    assert data_context.user_role == UserRole.STUDENT
    room_id = await room_db.get_room_for_invite_code(data_context, body.invite_code)
    if not room_id:
        raise HTTPException(400, "Invite code invalid")

    await room_db.join_room(data_context, room_id, data_context.user_id)


@router.get("")
async def list_rooms(data_context: DataContext = Depends(get_data_context)):
    user = await user_db.get_user(data_context, data_context.user_id)
    assert user
    rooms = await room_db.list_rooms(data_context, data_context.user_id, data_context.user_role)

    return JSONResponse(
        ListRoomsResponse(
            user_role=data_context.user_role, user_display_name=user.display_name, rooms=rooms
        ).model_dump(mode="json")
    )
