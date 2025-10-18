from psycopg import AsyncCursor

from api.dal import id_map
from api.dependencies import DataContext, UnAuthDataContext
from api.models.user_models import AuthData, UserRole
from api.utils import internal_id


async def insert_session(data_context: DataContext | UnAuthDataContext, user_id: str) -> str:
    session_id = internal_id()

    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            insert into session (
                public_id, sabqcha_user_row_id
            )
            values (%s, %s)
            """,
            (session_id, user_row_id),
        )
        return session_id


async def expire_user_sessions(data_context: DataContext | UnAuthDataContext, user_id: str):
    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            update session set is_expired = true where sabqcha_user_row_id = %s
            """,
            (user_row_id,),
        )


async def get_session(cur: AsyncCursor, session_id: str) -> AuthData | None:
    await cur.execute(
        """
        select
            t.row_id as teacher_row_id,
            st.row_id as student_row_id,
            su.public_id as user_id
        from
            session s
            join sabqcha_user su on
                su.row_id = s.sabqcha_user_row_id
            left join teacher t on
                t.sabqcha_user_row_id = su.row_id
            left join student st on
                st.sabqcha_user_row_id = su.row_id
        where
            s.public_id = %s
        """,
        (session_id,),
    )
    row = await cur.fetchone()
    if not row:
        return None

    is_teacher = row[0] is not None
    is_student = row[1] is not None

    if is_teacher:
        assert not is_student
    if is_student:
        assert not is_teacher

    return AuthData(
        user_id=row[2],
        role=UserRole.STUDENT if is_student else UserRole.TEACHER,
    )
