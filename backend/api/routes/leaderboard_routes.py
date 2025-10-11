from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from api.dependencies import DataContext, get_data_context
from api.dal import leaderboard_db


router = APIRouter(prefix="/leaderboard")


@router.get("/{room_id}")
async def get_leaderboard(room_id: str, data_context: DataContext = Depends(get_data_context)):
    students = await leaderboard_db.list_students_with_scores(data_context, room_id)
    students = sorted(students, key=lambda u: u.score, reverse=True)

    res = [
        {**ud.model_dump(mode="json"), "rank": rank, "current_user": data_context.user_id == ud.id}
        for rank, ud in enumerate(students, start=1)
    ]

    return JSONResponse(content=res)
