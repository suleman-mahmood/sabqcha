from psycopg import Cursor


def get_user_row_id(cur: Cursor, user_id: str) -> int | None:
    cur.execute("select id from sabqcha_user where public_id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        return None
    return row[0]


def get_transcription_row_id(cur: Cursor, trans_id: str) -> int | None:
    cur.execute("select id from transcription where public_id = %s", (trans_id,))
    row = cur.fetchone()
    if not row:
        return None
    return row[0]
