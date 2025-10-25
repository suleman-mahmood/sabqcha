from psycopg import AsyncCursor


async def get_user_row_id(cur: AsyncCursor, user_id: str) -> int | None:
    await cur.execute("select row_id from sabqcha_user where public_id = %s", (user_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_teacher_row_id(cur: AsyncCursor, teacher_id: str) -> int | None:
    await cur.execute(
        """
        select
            t.row_id
        from
            teacher t
            join sabqcha_user su on
                su.row_id = t.sabqcha_user_row_id
        where
            su.public_id = %s
        """,
        (teacher_id,),
    )
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_student_row_id(cur: AsyncCursor, student_id: str) -> int | None:
    await cur.execute(
        """
        select
            st.row_id
        from
            student st
            join sabqcha_user su on
                su.row_id = st.sabqcha_user_row_id
        where
            su.public_id = %s
        """,
        (student_id,),
    )
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_room_row_id(cur: AsyncCursor, room_id: str) -> int | None:
    await cur.execute("select row_id from room where public_id = %s", (room_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_lecture_group_row_id(cur: AsyncCursor, lecture_group_id: str) -> int | None:
    await cur.execute("select row_id from lecture_group where public_id = %s", (lecture_group_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_lecture_row_id(cur: AsyncCursor, lecture_id: str) -> int | None:
    await cur.execute("select row_id from lecture where public_id = %s", (lecture_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_task_set_row_id(cur: AsyncCursor, task_set_id: str) -> int | None:
    await cur.execute("select row_id from task_set where public_id = %s", (task_set_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_task_row_id(cur: AsyncCursor, task_id: str) -> int | None:
    await cur.execute("select row_id from task where public_id = %s", (task_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_quiz_row_id(cur: AsyncCursor, quiz_id: str) -> int | None:
    await cur.execute("select row_id from quiz where public_id = %s", (quiz_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_subject_row_id(cur: AsyncCursor, subject_id: str) -> int | None:
    await cur.execute("select row_id from subject where public_id = %s", (subject_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_past_paper_row_id(cur: AsyncCursor, past_paper_id: str) -> int | None:
    await cur.execute("select row_id from past_paper_bank where public_id = %s", (past_paper_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]
