from psycopg import AsyncCursor


async def get_user_row_id(cur: AsyncCursor, user_id: str) -> int | None:
    await cur.execute("select id from sabqcha_user where public_id = %s", (user_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]


async def get_transcription_row_id(cur: AsyncCursor, trans_id: str) -> int | None:
    await cur.execute("select id from transcription where public_id = %s", (trans_id,))
    row = await cur.fetchone()
    if not row:
        return None
    return row[0]
