from api.dependencies import DataContext
from api.utils import internal_id


async def insert_pending_job(data_context: DataContext, identifier: str) -> str:
    job_id = internal_id()

    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            insert into job (
                public_id, identifier, in_progress
            )
            values (
                %s, %s, true
            )
            """,
            (job_id, identifier),
        )

    return job_id


async def complete_job(data_context: DataContext, job_id: str):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update job set
                in_progress = false
            where
                public_id = %s
            """,
            (job_id,),
        )


async def get_job(data_context: DataContext, identifier: str) -> bool | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                in_progress
            from
                job
            where
                identifier = %s
            """,
            (identifier,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return row[0]
