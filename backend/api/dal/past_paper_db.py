from psycopg import sql

from api.dal import id_map
from api.dependencies import DataContext
from api.models.past_paper_models import PastPaper
from api.utils import internal_id


async def insert_student_solution(
    data_context: DataContext, past_paper_id: str, solution_file_path: str, user_id: str
) -> str:
    solution_id = internal_id()

    async with data_context.get_cursor() as cur:
        past_paper_row_id = await id_map.get_past_paper_row_id(cur, past_paper_id)
        assert past_paper_row_id

        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            insert into student_past_paper_solution (
                public_id, past_paper_bank_row_id, solution_file_path, sabqcha_user_row_id
            )
            values (
                %s, %s, %s, %s
            )
            """,
            (solution_id, past_paper_row_id, solution_file_path, user_row_id),
        )

    return solution_id


async def update_llm_contents_for_solution(
    data_context: DataContext, solution_id: str, graded_text: str
):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            insert into llm_content_extract (
                public_id,
                content,
                content_type
            ) values (
                %s, %s, 'GRADED_STUDENT_SOLUTION'
            )
            returning row_id
            """,
            (internal_id(), graded_text),
        )
        content_row = await cur.fetchone()
        assert content_row
        content_row_id = content_row[0]

        await cur.execute(
            """
            update student_past_paper_solution set
                llm_content_extract_row_id = %s
            where
                public_id = %s
            """,
            (content_row_id, solution_id),
        )


async def get_student_graded_solution(
    data_context: DataContext, user_id: str, past_paper_id: str
) -> str | None:
    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        past_paper_row_id = await id_map.get_past_paper_row_id(cur, past_paper_id)
        assert past_paper_row_id

        await cur.execute(
            """
            select
                lce.content
            from
                student_past_paper_solution spps
                join llm_content_extract lce on lce.row_id = spps.llm_content_extract_row_id
            where
                spps.past_paper_bank_row_id = %s and
                spps.sabqcha_user_row_id = %s
            order by
                spps.created_at desc
            limit 1
            """,
            (past_paper_row_id, user_row_id),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]


async def get_rubric_for_past_paper(data_context: DataContext, past_paper_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                s.rubric_content
            from
                subject s
                join past_paper_bank ppb on ppb.subject_row_id = s.row_id
            where
                ppb.public_id = %s
            """,
            (past_paper_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]


async def get_random_past_paper(data_context: DataContext, subject_id: str) -> PastPaper | None:
    papers = await list_past_papers(data_context, None, subject_id)
    if papers:
        return papers[0]
    return None


async def get_past_paper(data_context: DataContext, past_paper_id: str) -> PastPaper | None:
    papers = await list_past_papers(data_context, past_paper_id, None)
    assert len(papers) <= 1

    if papers:
        return papers[0]
    return None


async def list_past_papers(
    data_context: DataContext, past_paper_id: str | None = None, subject_id: str | None = None
) -> list[PastPaper]:
    assert past_paper_id or subject_id

    conditions: list[sql.SQL] = []
    args: list[str | int] = []

    query = sql.SQL(
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
        """
    )

    if past_paper_id:
        conditions.append(sql.SQL("ppb.public_id = %s"))
        args.append(past_paper_id)

    if subject_id:
        conditions.append(sql.SQL("s.public_id = %s"))
        args.append(subject_id)

    if conditions:
        query += sql.SQL(" where ") + sql.SQL(" and ").join(conditions)
    query += sql.SQL(" order by ppb.created_at desc ")

    async with data_context.get_model_cursor(PastPaper) as cur:
        await cur.execute(query, args)
        return await cur.fetchall()


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
