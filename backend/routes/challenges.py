from fastapi import APIRouter, Depends, HTTPException

from models.schemas import Challenge, User
from services.auth import get_current_user
from services.database import db

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("", response_model=list[Challenge])
async def get_challenges(current_user: User = Depends(get_current_user)):
    challenges = await db.challenges.find({}, {"_id": 0}).to_list(1000)
    return challenges


@router.get("/{challenge_id}", response_model=Challenge)
async def get_challenge(challenge_id: str, current_user: User = Depends(get_current_user)):
    challenge = await db.challenges.find_one({"id": challenge_id}, {"_id": 0})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.post("", response_model=Challenge)
async def create_challenge(challenge: Challenge, current_user: User = Depends(get_current_user)):
    doc = challenge.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.challenges.insert_one(doc)
    return challenge
