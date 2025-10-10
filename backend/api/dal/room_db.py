from api.dal import id_map
from api.dependencies import DataContext
from api.utils import internal_id, invite_code


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
        student_row_id = await id_map.get_teacher_row_id(cur, student_id)
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


async def get_room_for_invite_code(data_context: DataContext, invite_code: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute("select public_id from room where invite_code = %s", (invite_code,))
        row = await cur.fetchone()
        return row[0] if row else None
