
from psycopg_pool import ConnectionPool
import os


dbname = os.getenv("SABQCHA_PG_DB")
user = os.getenv("SABQCHA_PG_USER")
password = os.getenv("SABQCHA_PG_PASSWORD")
host = os.getenv("SABQCHA_PG_HOST")
port = os.getenv("SABQCHA_PG_PORT")

assert dbname and user and password and host and port

pool = ConnectionPool(f"dbname={dbname} user={user} password={password} host={host} port={port}", min_size=1, max_size=10)


def get_cursor():
    with pool.connection() as conn:
        with conn.cursor() as cur:
            yield cur
