from api.dal import id_map
from api.dependencies import DataContext
from api.models.transcription_models import LlmMcq
from api.utils import internal_id
from api.models.task_models import Task


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


async def get_task_set(data_context: DataContext, task_set_id: str) -> list[Task]:
    async with data_context.get_cursor() as cur:
        task_set_row_id = await id_map.get_task_set_row_id(cur, task_set_id)
        assert task_set_row_id

        await cur.execute(
            """
            select
                public_id, question, answer, options
            from
                task
            where
                task_set_row_id = %s
            )
            """,
            (task_set_row_id,),
        )
        rows = await cur.fetchall()
    return [Task(id=r[0], question=r[1], answer=r[2], options=r[3]) for r in rows]
