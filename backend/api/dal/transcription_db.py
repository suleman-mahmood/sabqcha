from psycopg import Cursor

from api.utils import internal_id
from api.dal import id_map
from api.models.transcription_models import TranscriptionListEntryUI


async def insert_transcription(cur: Cursor, file_path: str, title: str, user_id: str, content: str) -> str:
    user_row_id = id_map.get_user_row_id(cur, user_id)
    assert user_row_id
    trans_id = internal_id()

    cur.execute(
        """
        insert into transcription (
            public_id, file_path, title, sabqcha_user_row_id, transcribed_content
        )
        values (%s, %s, %s, %s, %s)
        returning id
        """,
        (trans_id, file_path, title, user_row_id, content)
    )

    cur.connection.commit()
    return trans_id

async def get_transcription(cur: Cursor, trans_id: str) -> TranscriptionListEntryUI | None:
    cur.execute(
        """
        select
            public_id, title
        from
            transcription
        where
            public_id = %s
        """,
        (trans_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return TranscriptionListEntryUI(doc_id=row[0], title=row[1])

async def list_transcriptions(cur: Cursor) -> list[TranscriptionListEntryUI]:
    cur.execute(
        """
        select
            public_id, title
        from
            transcription
        """,
    )
    rows = cur.fetchall()
    return [TranscriptionListEntryUI(doc_id=r[0], title=r[1]) for r in rows]
