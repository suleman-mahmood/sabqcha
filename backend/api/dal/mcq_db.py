from psycopg import AsyncCursor

from api.utils import internal_id
from api.dal import id_map
from api.models.transcription_models import LlmMcq


async def insert_mcq(cur: AsyncCursor, trans_id: str, question: str, options: list[str], answer: str):
    trans_row_id = await id_map.get_transcription_row_id(cur, trans_id)
    assert trans_row_id

    await cur.execute(
        """
        insert into mcq (
            public_id, transcription_row_id, question, options, answer
        )
        values (%s, %s, %s, %s, %s)
        """,
        (internal_id(), trans_row_id, question, options, answer)
    )

    await cur.connection.commit()

async def list_mcqs(cur: AsyncCursor, trans_id: str) -> list[LlmMcq]:
    trans_row_id = await id_map.get_transcription_row_id(cur, trans_id)
    assert trans_row_id
    
    await cur.execute(
        """
        select
            question, options, answer
        from
            mcq
        where
            transcription_row_id = %s
        """,
        (trans_row_id,)
    )
    rows = await cur.fetchall()
    return [LlmMcq(question=r[0], options=r[1], answer=r[2], ) for r in rows]
