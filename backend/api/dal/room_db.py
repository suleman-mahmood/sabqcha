from api.dal import id_map
from api.dependencies import DataContext
from api.models.room_models import Room
from api.models.user_models import UserRole
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
        student_row_id = await id_map.get_student_row_id(cur, student_id)
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


async def migrate_rooms(data_context: DataContext, from_user_id: str, to_user_id: str):
    async with data_context.get_cursor() as cur:
        from_student_row_id = await id_map.get_student_row_id(cur, from_user_id)
        assert from_student_row_id
        to_student_row_id = await id_map.get_student_row_id(cur, to_user_id)
        assert to_student_row_id

        await cur.execute(
            """
            with moved as (
                delete from student_room as sr_old
                where student_row_id = %s
                returning sr_old.room_row_id, sr_old.score
            )
            insert into student_room (room_row_id, student_row_id, score)
            select m.room_row_id, %s, m.score
            from moved m
            on conflict (room_row_id, student_row_id)
            do update
            set score = student_room.score + excluded.score;
            """,
            (from_student_row_id, to_student_row_id),
        )


async def list_rooms(data_context: DataContext, user_id: str, user_role: UserRole) -> list[Room]:
    async with data_context.get_cursor() as cur:
        match user_role:
            case UserRole.STUDENT:
                await cur.execute(
                    """
                    select
                        r.public_id,
                        r.display_name,
                        r.invite_code,
                        (
                            select
                                ts.public_id
                            from
                                task_set ts
                                join lecture_group lg on
                                    lg.row_id = ts.lecture_group_row_id and
                                    lg.room_row_id = r.row_id
                            order by ts.created_at desc
                            limit 1
                        ) as daily_task_set_id,
                        sr.score
                    from
                        room r
                        join student_room sr on sr.room_row_id = r.row_id
                        join student s on s.row_id = sr.student_row_id
                        join sabqcha_user su on su.row_id = s.sabqcha_user_row_id
                    where
                        su.public_id = %s
                    """,
                    (user_id,),
                )
                rows = await cur.fetchall()
                return [
                    Room(
                        id=r[0],
                        display_name=r[1],
                        invite_code=r[2],
                        daily_task_set_id=r[3],
                        score=r[4],
                    )
                    for r in rows
                ]
            case UserRole.TEACHER:
                await cur.execute(
                    """
                    select
                        r.public_id,
                        r.display_name,
                        r.invite_code
                    from
                        room r
                        join teacher t on t.row_id = r.teacher_row_id
                        join sabqcha_user su on su.row_id = t.sabqcha_user_row_id
                    where
                        su.public_id = %s
                    """,
                    (user_id,),
                )
                rows = await cur.fetchall()
                return [
                    Room(
                        id=r[0],
                        display_name=r[1],
                        invite_code=r[2],
                        daily_task_set_id=None,
                        score=None,
                    )
                    for r in rows
                ]


async def get_room(data_context: DataContext, room_id: str) -> Room | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                r.public_id,
                r.display_name,
                r.invite_code
            from
                room r
            where
                r.public_id = %s
            """,
            (room_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return Room(
        id=row[0], display_name=row[1], invite_code=row[2], daily_task_set_id=None, score=None
    )


async def get_student_room(data_context: DataContext, user_id: str, room_id: str) -> Room | None:
    async with data_context.get_cursor() as cur:
        student_row_id = await id_map.get_student_row_id(cur, user_id)
        assert student_row_id

        await cur.execute(
            """
            select
                r.public_id,
                r.display_name,
                r.invite_code,
                sr.score
            from
                room r
                join student_room sr on
                    sr.room_row_id = r.row_id and
                    sr.student_row_id = %s
            where
                r.public_id = %s
            """,
            (student_row_id, room_id),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return Room(
        id=row[0], display_name=row[1], invite_code=row[2], score=row[3], daily_task_set_id=None
    )


async def get_room_for_invite_code(data_context: DataContext, invite_code: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute("select public_id from room where invite_code = %s", (invite_code,))
        row = await cur.fetchone()
        return row[0] if row else None


async def get_room_for_task_set(data_context: DataContext, task_set_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                r.public_id
            from
                room r
                join lecture_group lg on lg.room_row_id = r.row_id
                join task_set ts on ts.lecture_group_row_id = lg.row_id
            where
                ts.public_id = %s
            """,
            (task_set_id,),
        )
        row = await cur.fetchone()
        return row[0] if row else None


async def update_user_score(
    data_context: DataContext, user_id: str, room_id: str, score_to_add: int
):
    async with data_context.get_cursor() as cur:
        student_row_id = await id_map.get_student_row_id(cur, user_id)
        assert student_row_id
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            update student_room set
                score = score + %s
            where
                student_row_id = %s and
                room_row_id = %s
            """,
            (
                score_to_add,
                student_row_id,
                room_row_id,
            ),
        )
