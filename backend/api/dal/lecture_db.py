from datetime import datetime
from api.dal import id_map
from api.dependencies import DataContext
from api.models.lecture_models import (
    Lecture,
    LectureEntryRes,
    LectureWeekRes,
    TaskSetRes,
)
from api.utils import internal_id


async def insert_lecture(
    data_context: DataContext, lecture_group_id: str, file_path: str, title: str
) -> str:
    lecture_id = internal_id()

    async with data_context.get_cursor() as cur:
        lecture_group_row_id = await id_map.get_lecture_group_row_id(cur, lecture_group_id)
        assert lecture_group_row_id

        await cur.execute(
            """
            insert into lecture (
                public_id, lecture_group_row_id, file_path, title
            )
            values (
                %s, %s, %s, %s
            )
            """,
            (lecture_id, lecture_group_row_id, file_path, title),
        )

    return lecture_id


async def get_this_week_lecture_group(data_context: DataContext, room_id: str) -> str:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                public_id
            from
                lecture_group
            where
                room_row_id = %s and
                created_at >= date_trunc('week', current_date) and
                created_at < date_trunc('week', current_date) + interval '1 week'
            """,
            (room_row_id,),
        )
        row = await cur.fetchone()
        if row:
            return row[0]

        # Enter a new row
        group_id = internal_id()
        await cur.execute(
            """
            insert into lecture_group (
                public_id, room_row_id
            )
            values (
                %s, %s
            )
            """,
            (group_id, room_row_id),
        )
        return group_id


async def list_lectures_for_group(data_context: DataContext, lecture_group_id: str):
    async with data_context.get_cursor() as cur:
        lecture_group_row_id = await id_map.get_lecture_group_row_id(cur, lecture_group_id)
        assert lecture_group_row_id

        await cur.execute(
            """
            select
                l.public_id as id,
                r.public_id as room_id,
                l.file_path,
                l.title
            from
                lecture l
                join lecture_group lg on lg.row_id = l.lecture_group_row_id
                join room r on r.row_id = lg.room_row_id
            where
                l.lecture_group_row_id = %s
            """,
            (lecture_group_row_id,),
        )
        rows = await cur.fetchall()
    return [Lecture(id=r[0], room_id=r[1], file_path=r[2], title=r[3]) for r in rows]


async def get_lecture(data_context: DataContext, lecture_id: str) -> Lecture | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                l.public_id as id,
                r.public_id as room_id,
                l.file_path,
                l.title
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
    return Lecture(id=row[0], room_id=row[1], file_path=row[2], title=row[3])


async def list_lectures_ui(
    data_context: DataContext, room_id: str
) -> tuple[LectureWeekRes | None, list[LectureWeekRes]]:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                lg.public_id as lecture_group_id,
                lg.created_at as lecture_week,
                json_agg(
                    jsonb_build_object(
                        'id', l.public_id,
                        'title', l.title,
                        'created_at', l.created_at
                    )
                )
            from
                lecture_group lg
                join lecture l on l.lecture_group_row_id  = lg.row_id
            where
                lg.room_row_id = %s
            group by
                lg.public_id, lg.created_at
            """,
            (room_row_id,),
        )
        lecture_rows = await cur.fetchall()

        await cur.execute(
            """
            select
                lg.public_id as lecture_group_id,
                lg.created_at as lecture_week,
                json_agg(
                    jsonb_build_object(
                        'id', ts.public_id,
                        'day', ts.day
                    )
                )
            from
                lecture_group lg
                join task_set ts on ts.lecture_group_row_id  = lg.row_id 
            where
                lg.room_row_id = %s
            group by
                lg.public_id, lg.created_at
            """,
            (room_row_id,),
        )
        task_set_rows = await cur.fetchall()

    # --- Merge both results by lecture_group_id ---
    data_by_group = {}
    for r in lecture_rows:
        lecture_group_id, lecture_week, lectures = r
        data_by_group[lecture_group_id] = {
            "lecture_week": lecture_week,
            "lectures": lectures,
            "task_sets": [],
        }

    for r in task_set_rows:
        lecture_group_id, lecture_week, task_sets = r
        if lecture_group_id in data_by_group:
            data_by_group[lecture_group_id]["task_sets"] = task_sets
        else:
            data_by_group[lecture_group_id] = {
                "lecture_week": lecture_week,
                "lectures": [],
                "task_sets": task_sets,
            }

    # --- Separate into this_week vs past_weeks ---
    today = datetime.now()
    current_year, current_week, _ = today.isocalendar()
    this_week_data: LectureWeekRes | None = None
    past_weeks: list[LectureWeekRes] = []

    for group_id, d in data_by_group.items():
        week_dt = d["lecture_week"]
        y, w, _ = week_dt.isocalendar()

        week_obj = LectureWeekRes(
            lecture_group_id=group_id,
            week_name=f"Week {w}, {y}",
            lectures=[LectureEntryRes(**lec) for lec in d["lectures"]],
            task_sets=[TaskSetRes(**ts) for ts in d["task_sets"]],
        )

        if (y, w) == (current_year, current_week):
            week_obj.week_name = "Current Week"
            this_week_data = week_obj
        else:
            past_weeks.append(week_obj)

    return this_week_data, past_weeks


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


async def get_lecture_group_for_task_set(data_context: DataContext, task_set_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                lg.public_id
            from
                lecture_group lg
                join task_set ts on
                    ts.lecture_group_row_id = lg.row_id and
                    ts.public_id = %s
            """,
            (task_set_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]


async def get_transcriptions_for_lecture_group(
    data_context: DataContext, lecture_group_id: str
) -> list[str]:
    async with data_context.get_cursor() as cur:
        lecture_group_row_id = await id_map.get_lecture_group_row_id(cur, lecture_group_id)
        assert lecture_group_row_id

        await cur.execute(
            """
            select
                l.transcribed_content
            from
                lecture l
            where
                l.lecture_group_row_id = %s
            """,
            (lecture_group_row_id,),
        )
        rows = await cur.fetchall()
    return [r[0] for r in rows]
