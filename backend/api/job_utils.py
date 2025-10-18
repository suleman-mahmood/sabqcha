from typing import Any, Awaitable, Callable, Dict, Tuple

from fastapi import BackgroundTasks
from loguru import logger
from psycopg.errors import UniqueViolation

from api.dal import job_db
from api.dependencies import DataContext

AsyncFunc = Callable[..., Awaitable[Any]]
IdentifierFn = Callable[[DataContext, Tuple[Any, ...], Dict[str, Any]], str]


async def _run_and_complete(
    data_context: DataContext, job_id: str, func: AsyncFunc, /, *args, **kwargs
):
    """Run the job func and mark job complete (always tries to complete)."""
    try:
        await func(data_context, *args, **kwargs)
    except Exception:
        logger.exception("Background job failed {}", job_id)

    await job_db.complete_job(data_context, job_id)


def background_job_decorator(identifier_fn: IdentifierFn):
    """
    Decorator factory that turns an async worker into a scheduleable function.
    The decorated name becomes a scheduler that you `await` from a route:
      scheduled = await decorated(background_tasks, data_context, *worker_args)
    If `False` is returned, a job is already in progress.
    """

    def decorator(worker: AsyncFunc):
        async def schedule(
            background_tasks: BackgroundTasks, data_context: DataContext, *args, **kwargs
        ) -> bool:
            identifier = identifier_fn(data_context, args, kwargs)
            try:
                job_id = await job_db.insert_pending_job(data_context, identifier)
            except UniqueViolation:
                in_progress = await job_db.get_job(data_context, identifier)
                assert in_progress is not None
                return in_progress

            background_tasks.add_task(
                _run_and_complete, data_context, job_id, worker, *args, **kwargs
            )
            return True

        # expose original worker if user wants to call it directly
        schedule._worker = worker  # type: ignore
        return schedule

    return decorator
