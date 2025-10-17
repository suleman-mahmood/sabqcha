from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response
from loguru import logger
from pydantic import BaseModel, EmailStr

from api.dependencies import (
    DataContext,
    UnAuthDataContext,
    get_data_context,
    get_un_auth_data_context,
)
from api.dal import session_db, user_db
from api import utils
from api.models.user_models import UserRole
from api.dal import room_db
from api.dal import task_db


router = APIRouter(prefix="/user")


@router.post("/device/{device_id}")
async def login_anonymous_user(
    device_id: str, data_context: UnAuthDataContext = Depends(get_un_auth_data_context)
):
    user_id = await user_db.get_user_id_from_device(data_context, device_id)

    if not user_id:
        # Create default student account
        display_name = utils.get_random_display_name()
        user_id = await user_db.insert_user(data_context, display_name)
        await user_db.insert_device(data_context, user_id, device_id)
        await user_db.insert_student(data_context, user_id)

    await session_db.expire_user_sessions(data_context, user_id)
    session_id = await session_db.insert_session(data_context, user_id)

    return JSONResponse({"token": session_id})


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(body: LoginBody, data_context: DataContext = Depends(get_data_context)):
    """Return teacher user associated with the email and password, and a login token"""
    user_id = await user_db.get_user_id_from_credentials(data_context, body.email, body.password)

    if not user_id:
        return Response("Invalid credentials", status_code=400)

    await session_db.expire_user_sessions(data_context, user_id)
    session_id = await session_db.insert_session(data_context, user_id)

    async with data_context.get_cursor() as cur:
        auth_data = await session_db.get_session(cur, session_id)
        assert auth_data

    if auth_data.role == UserRole.STUDENT:
        # Move existing local data to this user
        assert user_id == auth_data.user_id
        assert data_context.user_id != user_id

        logger.info("Migrating student data from {} to {}", data_context.user_id, user_id)
        await room_db.migrate_rooms(data_context, data_context.user_id, user_id)
        await task_db.migrate_attempts(data_context, data_context.user_id, user_id)

    return JSONResponse({"token": session_id})


class SignupStudentBody(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup-student")
async def signup_student(
    body: SignupStudentBody,
    data_context: DataContext = Depends(get_data_context),
    un_auth_data_context: UnAuthDataContext = Depends(get_un_auth_data_context),
):
    # Make sure it is an anonymous student account trying to signup
    assert data_context.user_role == UserRole.STUDENT

    user_id = await user_db.get_user_id_from_credentials(data_context, body.email, body.password)
    if user_id:
        return Response(
            "User for these credentials already exist, please login instead",
            status_code=400,
        )

    # TODO: Verify password is valid
    if len(body.password) < 8:
        return Response("Password should be at least 8 chars long", status_code=400)

    # Link data_context's user with these credentials
    # The data_context's user is the local device user
    await user_db.add_user_credentials(
        data_context, data_context.user_id, body.email, body.password
    )

    # We don't need a device id to recognize the user
    await user_db.remove_user_devices(data_context, data_context.user_id)

    await session_db.expire_user_sessions(data_context, data_context.user_id)
    session_id = await session_db.insert_session(un_auth_data_context, data_context.user_id)
    return JSONResponse({"token": session_id})


# TODO: Implement Student login
# TODO: Implement Student link accounts on different devices
