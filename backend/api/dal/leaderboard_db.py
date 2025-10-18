from api.dal import id_map
from api.dependencies import DataContext
from api.models.user_models import StudentUser


async def list_students_with_scores(data_context: DataContext, room_id: str) -> list[StudentUser]:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                su.public_id as id,
                su.display_name,
                sr.score
            from
                student st
                join sabqcha_user su on su.row_id = st.sabqcha_user_row_id
                join student_room sr on sr.student_row_id = st.row_id
            where
                sr.room_row_id = %s
            """,
            (room_row_id,),
        )
        rows = await cur.fetchall()
    return [StudentUser(id=r[0], display_name=r[1], score=r[2]) for r in rows]
