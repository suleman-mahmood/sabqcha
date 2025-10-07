from psycopg import AsyncCursor

from api.models.transcription_models import UserDocWithId
from api.utils import internal_id

async def insert_user(cur: AsyncCursor, display_name: str, score: int):
    await cur.execute(
        """
        insert into sabqcha_user (
            public_id, display_name, score
        )
        values (%s, %s, %s)
        """,
        (internal_id(), display_name, score)
    )
    await cur.connection.commit()

async def list_users(cur: AsyncCursor) -> list[UserDocWithId]:
    await cur.execute(
        """
        select
            public_id, display_name, score
        from
            sabqcha_user
        """,
    )
    rows = await cur.fetchall()
    return [UserDocWithId(user_id=r[0], display_name=r[1], score=r[2]) for r in rows]


async def get_user(cur: AsyncCursor, user_id: str) -> UserDocWithId | None:
    await cur.execute(
        """
        select
            public_id, display_name, score
        from
            sabqcha_user
        where
            public_id = %s
        """,
        (user_id,)
    )
    row = await cur.fetchone()
    if not row:
        return None
    return UserDocWithId(user_id=row[0], display_name=row[1], score=row[2])


async def update_user_score(cur: AsyncCursor, user_id: str, new_score: int):
    await cur.execute(
        """
        update sabqcha_user set
            score = %s
        where
            public_id = %s
        """,
        (new_score, user_id,)
    )
    await cur.connection.commit()
