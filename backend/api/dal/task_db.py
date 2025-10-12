import json
from api.dal import id_map
from api.dependencies import DataContext
from api.models.transcription_models import LlmMcq
from api.utils import internal_id
from api.models.task_models import Task, TaskAttempted, TaskSet, WeekDay


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
