import json

from api.dal import id_map
from api.dependencies import DataContext
from api.models.transcription_models import LlmMcq
from api.utils import internal_id
from api.models.task_models import (
    Task,
    TaskAttempted,
    TaskSet,
    TaskSetAttemptRes,
    TaskSetRes,
    WeekDay,
)


async def insert_task_set(
    data_context: DataContext, lecture_group_id: str, tasks: list[LlmMcq], day: WeekDay
) -> str:
    task_set_id = internal_id()

    async with data_context.get_cursor() as cur:
        lecture_group_row_id = await id_map.get_lecture_group_row_id(cur, lecture_group_id)
        assert lecture_group_row_id

        await cur.execute(
            """
            insert into task_set (
                public_id, lecture_group_row_id, day
            )
            values (
                %s, %s, %s
            )
            returning row_id
            """,
            (task_set_id, lecture_group_row_id, day.value),
        )
        row = await cur.fetchone()
        assert row
        task_set_row_id = row[0]

        await cur.executemany(
            """
            insert into task (
                public_id, task_set_row_id, question, answer, options
            )
            values (
                %s, %s, %s, %s, %s
            )
            """,
            (
                (
                    internal_id(),
                    task_set_row_id,
                    t.question,
                    t.answer,
                    t.options,
                )
                for t in tasks
            ),
        )

    return task_set_id


async def insert_attempt(
    data_context: DataContext,
    task_set_id: str,
    user_attempts: list[TaskAttempted],
    correct: int,
    incorrect: int,
    skip: int,
    time_elapsed: int,
) -> str:
    attempt_id = internal_id()

    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            insert into task_set_attempt (
                public_id, task_set_row_id, user_attempts, time_elapsed, correct_count, incorrect_count, skip_count
            )
            values (
                %s, %s, %s::jsonb, %s, %s, %s, %s
            )
            """,
            (
                attempt_id,
                task_set_row_id,
                json.dumps([ua.model_dump(mode="json") for ua in user_attempts]),
                time_elapsed,
                correct,
                incorrect,
                skip,
            ),
        )

    return attempt_id


async def get_task_set(data_context: DataContext, task_set_id: str) -> TaskSet | None:
    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            select
                ts.public_id,
                ts.day,
                r.display_name,
                json_agg(
                    json_build_object(
                        'id', t.public_id,
                        'question', t.question,
                        'answer', t.answer,
                        'options', t.options
                    )
                    order by t.row_id
                ) as tasks
            from
                task_set ts
                join task t on t.task_set_row_id = ts.row_id
                join lecture_group lg on lg.row_id = ts.lecture_group_row_id
                join room r on r.row_id = lg.room_row_id
            where
                ts.row_id = %s
            group by
                ts.public_id, ts.day, r.display_name
            """,
            (task_set_row_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return TaskSet(
        id=row[0],
        day=row[1],
        lecture_name=row[2],
        tasks=[
            Task(id=t["id"], question=t["question"], answer=t["answer"], options=t["options"])
            for t in row[3]
        ],
    )


async def list_task_sets_for_room(data_context: DataContext, room_id: str) -> list[TaskSetRes]:
    async with data_context.get_cursor() as cur:
        room_row_id = await id_map.get_room_row_id(cur, room_id)
        assert room_row_id

        await cur.execute(
            """
            select
                ts.public_id as task_set_id,
                ts.day as task_set_day,
                coalesce(
                    json_agg(
                        json_build_object (
                            'id', tsa.public_id,
                            'time_elapsed', tsa.time_elapsed,
                            'correct', tsa.correct_count,
                            'incorrect', tsa.incorrect_count,
                            'skip', tsa.skip_count,
                            'created_at', tsa.created_at,
                            'user_attempts', tsa.user_attempts
                        )
                    ) filter (where tsa.public_id is not null),
                '[]'::json
                ) as attempts
            from
                task_set ts
                join lecture_group lg on lg.row_id = ts.lecture_group_row_id
                join room r on r.row_id = lg.room_row_id
                left join task_set_attempt tsa on tsa.task_set_row_id = ts.row_id
            where
                r.row_id = %s
            group by
                ts.public_id, ts.day, ts.created_at
            order by ts.created_at desc
            """,
            (room_row_id,),
        )
        rows = await cur.fetchall()

    return [
        TaskSetRes(
            id=r[0],
            day=r[1],
            attempts=[
                TaskSetAttemptRes(
                    id=at["id"],
                    time_elapsed=at["time_elapsed"],
                    correct_count=at["correct"],
                    incorrect_count=at["incorrect"],
                    skip_count=at["skip"],
                    accuracy=(float(at["correct"]) * 100.0)
                    / float(at["correct"] + at["incorrect"] + at["skip"]),
                    created_at=at["created_at"],
                    user_attempts=[
                        TaskAttempted(answer=ua["answer"], did_skip=ua["did_skip"])
                        for ua in at["user_attempts"]
                    ],
                )
                for at in r[2]
            ],
        )
        for r in rows
    ]


async def get_room_id_for_task_set(data_context: DataContext, task_set_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            select
                r.public_id
            from
                room r
                join lecture_group lg on lg.room_row_id = r.row_id
                join task_set ts on
                    ts.lecture_group_row_id = lg.row_id and
                    ts.row_id = %s
            """,
            (task_set_row_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]


async def insert_pending_analysis(data_context: DataContext, task_set_id: str) -> str:
    analysis_id = internal_id()

    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            insert into task_set_analysis (
                public_id, task_set_row_id, in_progress
            )
            values (
                %s, %s, true
            )
            """,
            (analysis_id, task_set_row_id),
        )

    return analysis_id


async def get_recent_analysis(
    data_context: DataContext, task_set_id: str
) -> tuple[dict, bool] | None:
    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            select
                analysis,
                in_progress
            from
                task_set_analysis
            where
                task_set_row_id = %s
            """,
            (task_set_row_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0], row[1]


async def add_analysis(data_context: DataContext, analysis_id: str, analysis: dict):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update task_set_analysis set
                analysis = %s::jsonb,
                in_progress = false
            where
                public_id = %s
            """,
            (json.dumps(analysis), analysis_id),
        )
