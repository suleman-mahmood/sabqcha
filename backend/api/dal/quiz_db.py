from typing import List

from psycopg import sql

from api.dal import id_map
from api.dependencies import DataContext
from api.models.quiz_model import Quiz, StudentSolution
from api.utils import internal_id


async def insert_quiz(
    data_context: DataContext,
    room_id: str,
    title: str,
    answer_sheet_path: str,
    rubric_path: str,
) -> str:
    """Insert a new quiz and return its public id."""
    quiz_id = internal_id()

    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            insert into quiz (
                public_id,
                room_row_id,
                title,
                answer_sheet_path,
                rubric_path
            ) values (
                %s, %s, %s, %s, %s
            )
            """,
            (quiz_id, room_row_id, title, answer_sheet_path, rubric_path),
        )

    return quiz_id


async def update_llm_contents_for_quiz(
    data_context: DataContext,
    quiz_id: str,
    rubric_text: str,
    marking_scheme_text: str,
):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            insert into llm_content_extract (
                public_id,
                content,
                content_type
            ) values (
                %s, %s, 'RUBRIC'
            )
            returning row_id
            """,
            (internal_id(), rubric_text),
        )
        rubric_row = await cur.fetchone()
        assert rubric_row
        rubric_row_id = rubric_row[0]

        await cur.execute(
            """
            insert into llm_content_extract (
                public_id,
                content,
                content_type
            ) values (
                %s, %s, 'MARKING_SCHEME'
            )
            returning row_id
            """,
            (internal_id(), marking_scheme_text),
        )
        ms_row = await cur.fetchone()
        assert ms_row
        ms_row_id = ms_row[0]

        await cur.execute(
            """
            update quiz set
                ms_llm_content_extract_row_id,
                rubric_llm_content_extract_row_id
            where
                public_id = %s
            """,
            (ms_row_id, rubric_row_id, quiz_id),
        )


async def get_quiz(data_context: DataContext, quiz_id: str) -> Quiz | None:
    quizes = await list_quizes(data_context, quiz_id=quiz_id)
    assert len(quizes) <= 1

    if len(quizes) == 1:
        return quizes[0]
    else:
        return None


async def list_quizzes_for_room(data_context: DataContext, room_id: str) -> List[Quiz]:
    quizes = await list_quizes(data_context, room_id=room_id)
    return quizes


async def list_quizes(
    data_context: DataContext, room_id: str | None = None, quiz_id: str | None = None
) -> list[Quiz]:
    conditions: list[str] = []
    args: list[str | int] = []

    query = sql.SQL("""
        select
            q.public_id as id,
            r.public_id as room_id,
            q.title,
            q.answer_sheet_path,
            q.rubric_path,
            ms_lce.content as ms_llm_content_extract_content,
            r_lce.content as rubric_llm_content_extract_content
        from
            quiz q
            join room r on r.row_id = q.room_id
            left join llm_content_extract ms_lce on ms_lce.row_id = q.ms_llm_content_extract_row_id
            left join llm_content_extract r_lce on r_lce.row_id = q.rubric_llm_content_extract_row_id
        {0}
    """)

    async with data_context.get_cursor() as cur:
        if room_id:
            room_row_id = await id_map.get_room_row_id(cur, room_id)
            assert room_row_id
            conditions.append("q.room_row_id = %s")
            args.append(room_row_id)

        if quiz_id:
            conditions.append("q.public_id = %s")
            args.append(quiz_id)

    async with data_context.get_model_cursor(Quiz) as cur:
        if conditions:
            composed_query = query.format(sql.SQL("where ") + sql.SQL(" ").join(conditions))
            await cur.execute(composed_query, args)
        else:
            await cur.execute(query, args)

        return await cur.fetchall()


async def insert_student_solution(
    data_context: DataContext, quiz_id: str, title: str, solution_path: str
) -> str:
    solution_id = internal_id()

    async with data_context.get_cursor() as cur:
        quiz_row_id = await id_map.get_quiz_row_id(cur, quiz_id)
        assert quiz_row_id

        await cur.execute(
            """
            insert into student_solution (
                public_id, quiz_row_id, title, solution_path
            ) values (
                %s, %s, %s, %s
            )
            """,
            (solution_id, quiz_row_id, title, solution_path),
        )

    return solution_id


async def get_student_solution(
    data_context: DataContext, solution_id: str
) -> StudentSolution | None:
    solutions = await list_student_solutions(data_context, solution_id=solution_id)
    assert len(solutions) <= 1

    if len(solutions) == 1:
        return solutions[0]
    else:
        return None


async def list_student_solutions_for_quiz(
    data_context: DataContext, quiz_id: str
) -> list[StudentSolution]:
    return await list_student_solutions(data_context, quiz_id=quiz_id)


async def list_student_solutions(
    data_context: DataContext, *, quiz_id: str | None = None, solution_id: str | None = None
) -> list[StudentSolution]:
    query = sql.SQL(
        """
        select
            ss.public_id as id,
            q.public_id as quiz_id,
            ss.title,
            ss.solution_path,
            ce.content as graded_llm_content_extract_content
        from 
            student_solution ss
            join quiz q on q.row_id = ss.quiz_row_id
            left join llm_content_extract lce on ms_lce.row_id = q.graded_llm_content_extract_row_id
        {0}
        order by
            ss.created_at desc
        """
    )
    conditions: list[str] = []
    args: list[str | int] = []

    if quiz_id:
        conditions.append("q.public_id = %s")
        args.append(quiz_id)

    if solution_id:
        conditions.append("ss.public_id = %s")
        args.append(solution_id)

    async with data_context.get_model_cursor(StudentSolution) as cur:
        await cur.execute(query, args)
        return await cur.fetchall()


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
            update student_solution set
                graded_llm_content_extract_row_id
            where
                public_id = %s
            """,
            (content_row_id, solution_id),
        )
