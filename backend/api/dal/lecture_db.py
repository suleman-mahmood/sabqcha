from api.dal import id_map
from api.dependencies import DataContext
from api.models.lecture_models import Lecture, LectureEntry
from api.utils import internal_id
from api.models.task_models import TaskSet


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
            """,
            (lecture_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return Lecture(
        id=row[0], room_id=row[1], file_path=row[2], title=row[3], transcribed_content=row[4]
    )


async def list_lectures(data_context: DataContext, room_id: str) -> list[LectureEntry]:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                l.public_id as id,
                l.title,
                coalesce(
                    json_agg(
                        json_build_object(
                            'id', ts.public_id,
                            'day', ts.day
                        )
                    ) filter (where ts.public_id is not null),
                    '[]'
                ) as task_sets
            from
                lecture l
                left join task_set ts
                    on ts.lecture_row_id = l.row_id
            where
                l.room_row_id = %s
            group by
                l.public_id, l.title, l.created_at
            order by l.created_at
            """,
            (room_row_id,),
        )
        rows = await cur.fetchall()
    return [
        LectureEntry(
            id=r[0],
            title=r[1],
            task_sets=[TaskSet(id=ts["id"], day=ts["day"]) for ts in r[2]],
        )
        for r in rows
    ]


async def add_transcription(data_context: DataContext, lecture_id: str, transcript: str):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update lecture set
                transcribed_content = %s
            where
                public_id = %s
            """,
            (transcript, lecture_id),
        )
