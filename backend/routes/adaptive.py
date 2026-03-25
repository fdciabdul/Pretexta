from fastapi import APIRouter, Depends

from models.schemas import User
from services.auth import get_current_user
from services.adaptive import get_recommended_difficulty, get_recommended_categories, get_adaptive_persona_params

router = APIRouter(prefix="/adaptive", tags=["adaptive"])


@router.get("/difficulty")
async def get_difficulty_recommendation(current_user: User = Depends(get_current_user)):
    """Get recommended difficulty for current user."""
    difficulty = await get_recommended_difficulty(current_user.id)
    categories = await get_recommended_categories(current_user.id)
    return {
        "recommended_difficulty": difficulty,
        "weak_categories": categories,
    }


@router.get("/persona-params")
async def get_persona_params(current_user: User = Depends(get_current_user)):
    """Get adaptive AI persona parameters based on user skill level."""
    return await get_adaptive_persona_params(current_user.id)
