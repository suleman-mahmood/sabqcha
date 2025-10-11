from api.dal import id_map
from api.dependencies import DataContext
from api.utils import internal_id, invite_code
from api.models.room_models import Room
from api.models.user_models import UserRole


async def insert_room(data_context: DataContext, display_name: str, teacher_id: str) -> str:
    room_id = internal_id()

    async with data_context.get_cursor() as cur:
        teacher_row_id = await id_map.get_teacher_row_id(cur, teacher_id)
        assert teacher_row_id

        await cur.execute(
            """
            insert into room (
                public_id, display_name, invite_code, teacher_row_id
            )
            values (
                %s, %s, %s, %s
            )
            """,
            (room_id, display_name, invite_code(), teacher_row_id),
        )

    return room_id


async def join_room(data_context: DataContext, room_id: str, student_id: str):
    async with data_context.get_cursor() as cur:
        student_row_id = await id_map.get_student_row_id(cur, student_id)
        assert student_row_id

        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            insert into student_room (
                student_row_id, room_row_id
            )
            values (
                %s, %s
            )
            """,
            (student_row_id, room_row_id),
        )


async def list_rooms(data_context: DataContext, user_id: str, user_role: UserRole) -> list[Room]:
    async with data_context.get_cursor() as cur:
        match user_role:
            case UserRole.STUDENT:
                await cur.execute(
                    """
                    select
                        r.public_id,
                        r.display_name,
                        r.invite_code
                    from
                        room r
                        join student_room sr on sr.room_row_id = r.row_id
                        join student s on s.row_id = sr.student_row_id
                        join sabqcha_user su on su.row_id = s.sabqcha_user_row_id
                    where
                        su.public_id = %s
                    """,
                    (user_id,),
                )
            case UserRole.TEACHER:
                await cur.execute(
                    """
                    select
                        r.public_id,
                        r.display_name,
                        r.invite_code
                    from
                        room r
                        join teacher t on t.row_id = r.teacher_row_id
                        join sabqcha_user su on su.row_id = t.sabqcha_user_row_id
                    where
                        su.public_id = %s
                    """,
                    (user_id,),
                )
        rows = await cur.fetchall()
    return [Room(id=r[0], display_name=r[1], invite_code=r[2]) for r in rows]


async def get_room(data_context: DataContext, room_id: str) -> Room | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                r.public_id,
                r.display_name,
                r.invite_code
            from
                room r
            where
                r.public_id = %s
            """,
            (room_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return Room(id=row[0], display_name=row[1], invite_code=row[2])


async def get_room_for_invite_code(data_context: DataContext, invite_code: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute("select public_id from room where invite_code = %s", (invite_code,))
        row = await cur.fetchone()
        return row[0] if row else None
