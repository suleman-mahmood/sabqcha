from api.dal import id_map
from api.dependencies import DataContext
from api.models.past_paper_models import PastPaper


async def get_random_past_paper(data_context: DataContext, subject_id: str) -> PastPaper | None:
    async with data_context.get_cursor() as cur:
        subject_row_id = await id_map.get_subject_row_id(cur, subject_id)
        assert subject_row_id

    async with data_context.get_model_cursor(PastPaper) as cur:
        await cur.execute(
            """
            select
                ppb.public_id as id,
                s.display_name || ' ' || s.code as subject,
                ppb.season,
                ppb.year,
                ppb.paper,
                ppb.variant,
                ppb.question_file_path,
                ppb.marking_scheme_file_path
            from
                past_paper_bank ppb
                join subject s on s.row_id = ppb.subject_row_id
            where
                subject_row_id = %s
            order by
                ppb.created_at desc
            limit 1
            """,
            (subject_row_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row


async def get_subject_id_for_room(data_context: DataContext, room_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                s.public_id
            from
                room r
                join subject s on s.row_id = r.subject_row_id
            where
                r.public_id = %s
            """,
            (room_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]
