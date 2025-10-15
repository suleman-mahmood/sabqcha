from api.dependencies import DataContext, UnAuthDataContext
from api.utils import internal_id
from api.dal import id_map
from api.models.user_models import User


async def get_user_id_from_device(data_context: UnAuthDataContext, device_id: str) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                su.public_id
            from
                sabqcha_user su
                join device_user du on
                    du.sabqcha_user_row_id = su.row_id
            where
                du.device_id = %s
            """,
            (device_id,),
        )
        row = await cur.fetchone()
        return row[0] if row else None


async def get_user_id_from_credentials(
    data_context: UnAuthDataContext | DataContext, email: str, password: str
) -> str | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                public_id
            from
                sabqcha_user
            where
                email = %s and
                password = %s
            """,
            (email, password),
        )
        row = await cur.fetchone()
        return row[0] if row else None


async def remove_user_devices(data_context: DataContext, user_id: str):
    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            delete from
                device_user
            where
                sabqcha_user_row_id = %s
            """,
            (user_row_id,),
        )


async def insert_user(data_context: UnAuthDataContext, display_name: str) -> str:
    user_id = internal_id()

    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            insert into sabqcha_user (
                public_id, display_name
            )
            values (%s, %s)
            """,
            (user_id, display_name),
        )
        await cur.connection.commit()
        return user_id


async def insert_device(data_context: UnAuthDataContext, user_id: str, device_id: str):
    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            insert into device_user (
                device_id, sabqcha_user_row_id
            )
            values (%s, %s)
            """,
            (device_id, user_row_id),
        )
        await cur.connection.commit()


async def insert_student(data_context: UnAuthDataContext, user_id: str):
    async with data_context.get_cursor() as cur:
        user_row_id = await id_map.get_user_row_id(cur, user_id)
        assert user_row_id

        await cur.execute(
            """
            insert into student (
                sabqcha_user_row_id
            )
            values (%s)
            """,
            (user_row_id,),
        )
        await cur.connection.commit()


async def add_user_credentials(data_context: DataContext, user_id: str, email: str, password: str):
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            update sabqcha_user set
                email = %s,
                password = %s
            where
                public_id = %s
            """,
            (email, password, user_id),
        )


async def get_user(data_context: DataContext | UnAuthDataContext, user_id: str) -> User | None:
    async with data_context.get_cursor() as cur:
        await cur.execute(
            """
            select
                su.public_id,
                su.display_name
            from
                sabqcha_user su
            where
                su.public_id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if not row:
            return None
    return User(id=row[0], display_name=row[1])
