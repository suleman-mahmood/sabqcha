from api.dal import id_map
from api.dependencies import DataContext
from api.models.lecture_models import Lecture
from api.utils import internal_id


async def insert_lecture(
    data_context: DataContext, room_id: str, file_path: str, title: str
) -> str:
    lecture_id = internal_id()

    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            insert into lecture (
                public_id, room_row_id, file_path, title
            )
            values (
                %s, %s, %s, %s
            )
            """,
            (lecture_id, room_row_id, file_path, title),
        )

    return lecture_id


async def get_lecture(data_context: DataContext, lecture_id: str) -> Lecture | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                l.public_id as id,
                r.public_id as room_id,
                l.file_path,
                l.title,
                l.transcribed_content
            from
                lecture l
                join room r on r.row_id = l.room_row_id
            where
                l.public_id = %s
            )
            """,
            (lecture_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return Lecture(
        id=row[0], room_id=row[1], file_path=row[2], title=row[3], transcribed_content=row[4]
    )


async def add_transcription(data_context: DataContext, lecture_id: str, transcript: str):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update lecture set
                transcribed_content = %s
            where
                public_id = %s
            )
            """,
            (transcript, lecture_id),
        )
