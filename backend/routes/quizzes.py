from fastapi import APIRouter, Depends, HTTPException

from models.schemas import Quiz, User
from services.auth import get_current_user
from services.database import db

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("", response_model=list[Quiz])
async def get_quizzes(current_user: User = Depends(get_current_user)):
    quizzes = await db.quizzes.find({}, {"_id": 0}).to_list(1000)
    return quizzes


@router.get("/{quiz_id}", response_model=Quiz)
async def get_quiz(quiz_id: str, current_user: User = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz
