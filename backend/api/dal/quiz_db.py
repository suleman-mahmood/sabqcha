from typing import List

from api.dal import id_map
from api.dependencies import DataContext
from api.models.quiz_model import Quiz, StudentSolutions
from api.utils import internal_id


async def insert_quiz(
    data_context: DataContext,
    room_id: str,
    title: str,
    answer_sheet_content: str | None = None,
    rubric_content: str | None = None,
    answer_sheet_path: str | None = None,
    rubric_path: str | None = None,
) -> str:
    """Insert a new quiz and return its public id."""
    quiz_id = internal_id()

    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            insert into quiz (
                public_id, room_id, title, answer_sheet_content, rubric_content, answer_sheet_path, rubric_path, created_by, updated_by
            ) values (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """,
            (
                quiz_id,
                room_row_id,
                title,
                answer_sheet_content or "",
                rubric_content or "",
                answer_sheet_path or "",
                rubric_path or "",
                data_context.user_id,
                data_context.user_id,
            ),
        )

    return quiz_id


async def get_quiz(data_context: DataContext, quiz_id: str) -> Quiz | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                q.public_id,
                r.public_id as room_id,
                q.title,
                q.answer_sheet_content,
                q.rubric_content,
                q.answer_sheet_path,
                q.rubric_path,
                q.created_by,
                q.created_at,
                q.updated_by,
                q.updated_at
            from quiz q
            join room r on r.row_id = q.room_id
            where q.public_id = %s
            """,
            (quiz_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None

    return Quiz(
        id=row[0],
        room_id=row[1],
        title=row[2],
        answer_sheet_content=row[3],
        rubric_content=row[4],
        answer_sheet_path=row[5],
        rubric_path=row[6],
        created_by=row[7],
        created_at_utc=row[8],
        updated_by=row[9],
        updated_at_utc=row[10],
    )


async def list_quizzes_for_room(data_context: DataContext, room_id: str) -> List[Quiz]:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                q.public_id,
                r.public_id as room_id,
                q.title,
                q.answer_sheet_content,
                q.rubric_content,
                q.answer_sheet_path,
                q.rubric_path,
                q.created_by,
                q.created_at,
                q.updated_by,
                q.updated_at
            from quiz q
            join room r on r.row_id = q.room_id
            where q.room_id = %s
            order by q.created_at desc
            """,
            (room_row_id,),
        )
        rows = await cur.fetchall()

    return [
        Quiz(
            id=r[0],
            room_id=r[1],
            title=r[2],
            answer_sheet_content=r[3],
            rubric_content=r[4],
            answer_sheet_path=r[5],
            rubric_path=r[6],
            created_by=r[7],
            created_at_utc=r[8],
            updated_by=r[9],
            updated_at_utc=r[10],
        )
        for r in rows
    ]


async def insert_student_solution(
    data_context: DataContext, quiz_id: str, title: str, solution_path: str
) -> str:
    solution_id = internal_id()

    async with data_context.get_cursor() as cur:
        
        quiz_row_id = await id_map.get_quiz_row_id(cur, quiz_id)
        assert quiz_row_id

        await cur.execute(
            """
            insert into student_solutions (
                public_id, quiz_row_id, title, solution_path, solution_content
            ) values (
                %s, %s, %s, %s, %s
            )
            """,
            (solution_id, quiz_row_id, title, solution_path, ""),
        )

    return solution_id


async def get_student_solution(
    data_context: DataContext, solution_id: str
) -> StudentSolutions | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                ss.public_id,
                ss.title,
                ss.solution_path,
                ss.solution_content,
                ss.created_at
            from student_solutions ss
            where ss.public_id = %s
            """,
            (solution_id,),
        )
        row = await cur.fetchone()

    if not row:
        return None

    return StudentSolutions(
        id=row[0],
        title=row[1],
        solution_path=row[2],
        solution_content=row[3],
        created_at_utc=row[4],
    )


async def update_student_solution_transcription(
    data_context: DataContext, solution_id: str, solution_text: str | None
) -> None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update student_solutions
            set solution_content = %s
            where public_id = %s
            """,
            (solution_text or "", solution_id),
        )


async def update_quiz_transcription(
    data_context: DataContext, quiz_id: str, answer_text: str | None, rubric_text: str | None
):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update quiz set
                answer_sheet_content = %s,
                rubric_content = %s,
                updated_by = %s,
                updated_at = now()
            where public_id = %s
            """,
            (answer_text or "", rubric_text or "", data_context.user_id, quiz_id),
        )


async def list_student_solutions_for_quiz(
    data_context: DataContext, quiz_id: str
) -> list[StudentSolutions]:
    
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                ss.public_id,
                ss.title,
                ss.solution_path,
                ss.solution_content,
                ss.created_at
            from student_solutions ss
            join quiz q on q.row_id = ss.quiz_row_id
            where q.public_id = %s
            order by ss.created_at desc
            """,
            (quiz_id,),
        )
        rows = await cur.fetchall()

    return [
        StudentSolutions(
            id=r[0],
            title=r[1],
            solution_path=r[2],
            solution_content=r[3],
            created_at_utc=r[4],
        )
        for r in rows
    ]


async def update_quiz_paths(
    data_context: DataContext,
    quiz_id: str,
    *,
    answer_sheet_path: str | None = None,
    rubric_path: str | None = None,
) -> None:
    assignments: list[str] = []
    params: list[str] = []

    if answer_sheet_path is not None:
        assignments.append("answer_sheet_path = %s")
        params.append(answer_sheet_path)
    if rubric_path is not None:
        assignments.append("rubric_path = %s")
        params.append(rubric_path)

    if not assignments:
        return

    assignments.append("updated_by = %s")
    params.append(data_context.user_id)
    assignments.append("updated_at = now()")

    query = f"""
        update quiz
        set {', '.join(assignments)}
        where public_id = %s
    """
    params.append(quiz_id)

    async with data_context.get_cursor() as cur:
        await cur.execute(query, params)
