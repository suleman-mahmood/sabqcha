from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel

from api.dependencies import UnAuthDataContext, get_un_auth_data_context
from api.dal import session_db, user_db
from api import utils


router = APIRouter(prefix="/user")


@router.post("/device/{device_id}")
async def login_anonymous_user(
    device_id: str, data_context: UnAuthDataContext = Depends(get_un_auth_data_context)
):
    user_id = await user_db.get_user_id_from_device(data_context, device_id)

    if not user_id:
        display_name = utils.get_random_display_name()
        user_id = await user_db.insert_user(data_context, display_name)
        await user_db.insert_device(data_context, user_id)
        await user_db.insert_student(data_context, user_id)

    session_id = await session_db.insert_session(data_context, user_id)

    return JSONResponse({"token": session_id})


class LoginTeacherBody(BaseModel):
    email: str
    password: str


@router.post("/login-teacher")
async def login_teacher(
    body: LoginTeacherBody, data_context: UnAuthDataContext = Depends(get_un_auth_data_context)
):
    """Return teacher user associated with the email and password, and a login token"""
    user_id = await user_db.get_user_id_from_credentials(data_context, body.email, body.password)

    if not user_id:
        return Response("Invalid credentials", status_code=400)

    await session_db.expire_user_sessions(data_context, user_id)
    session_id = await session_db.insert_session(data_context, user_id)

    return JSONResponse({"session_id": session_id})


# TODO: Implement Student login
# TODO: Implement Student link accounts on different devices
