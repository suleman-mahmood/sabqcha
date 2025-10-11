from api.dal import id_map
from api.dependencies import DataContext
from api.models.transcription_models import LlmMcq
from api.utils import internal_id
from api.models.task_models import Task, TaskSet


async def insert_task_set(data_context: DataContext, lecture_id: str, tasks: list[LlmMcq]) -> str:
    task_set_id = internal_id()

    async with data_context.get_cursor() as cur:
        lecture_row_id = await id_map.get_lecture_row_id(cur, lecture_id)
        assert lecture_row_id

        await cur.execute(
            """
            insert into task_set (
                public_id, lecture_row_id, day
            )
            values (
                %s, %s, 'MONDAY'
            )
            returning row_id
            """,
            (task_set_id, lecture_row_id),
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


async def get_task_set(data_context: DataContext, task_set_id: str) -> TaskSet | None:
    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            select
                ts.public_id,
                ts.day,
                l.title,
                json_agg(
                    json_build_object(
                        'id', t.public_id,
                        'question', t.question,
                        'answer', t.answer,
                        'options', t.options
                    )
                ) as tasks
            from
                task_set ts
                join lecture l on l.row_id = ts.lecture_row_id
                join task t on t.task_set_row_id = ts.row_id
            where
                t.task_set_row_id = %s
            group by
                ts.public_id, ts.day, l.title
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
