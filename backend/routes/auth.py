import re
from fastapi import APIRouter, HTTPException, Depends

from models.schemas import User, LoginRequest, LoginResponse, RegisterRequest, PasswordChangeRequest, ProfileUpdateRequest
from services.auth import hash_password, verify_password, create_token, get_current_user
from services.database import db
from services.gamification import award_xp

router = APIRouter(prefix="/auth", tags=["auth"])

PASSWORD_MIN_LENGTH = 8


def validate_password(password: str) -> str:
    """Validate password complexity. Returns error message or empty string."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return f"Password must be at least {PASSWORD_MIN_LENGTH} characters"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[0-9]", password):
        return "Password must contain at least one number"
    return ""


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """Register a new user account."""
    # Check if username already exists
    existing = await db.users.find_one({"username": request.username})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    # Validate password
    pw_error = validate_password(request.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    # Check invite code if provided (for org joining)
    organization_id = None
    if request.invite_code:
        org = await db.organizations.find_one({"invite_code": request.invite_code})
        if not org:
            raise HTTPException(status_code=400, detail="Invalid invite code")
        organization_id = org["id"]

    # Create user
    user = User(
        username=request.username,
        password_hash=hash_password(request.password),
        email=request.email,
        display_name=request.display_name or request.username,
        organization_id=organization_id,
    )
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.users.insert_one(doc)

    # Add to organization if invite code
    if organization_id:
        await db.organizations.update_one(
            {"id": organization_id},
            {"$addToSet": {"member_ids": user.id}},
        )

    token = create_token(user.id)
    return LoginResponse(
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role": user.role,
            "created_at": user.created_at.isoformat(),
        },
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"username": request.username}, {"_id": 0})

    if not user_doc or not verify_password(request.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = User(**user_doc)
    token = create_token(user.id)

    # Update last_active and check streak
    await award_xp(user.id, 0, check_streak=True)

    return LoginResponse(
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role": user.role,
            "organization_id": user.organization_id,
            "xp": user.xp,
            "level": user.level,
            "badges": user.badges,
            "streak_days": user.streak_days,
            "theme": user.theme,
            "created_at": user.created_at.isoformat(),
        },
    )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "email": current_user.email,
        "role": current_user.role,
        "organization_id": current_user.organization_id,
        "xp": current_user.xp,
        "level": current_user.level,
        "badges": current_user.badges,
        "streak_days": current_user.streak_days,
        "theme": current_user.theme,
        "notifications_enabled": current_user.notifications_enabled,
        "created_at": current_user.created_at.isoformat(),
    }


@router.put("/profile")
async def update_profile(
    updates: ProfileUpdateRequest, current_user: User = Depends(get_current_user)
):
    """Update user profile."""
    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.users.update_one({"id": current_user.id}, {"$set": update_data})
    return {"message": "Profile updated"}


@router.post("/change-password")
async def change_password(
    request: PasswordChangeRequest, current_user: User = Depends(get_current_user)
):
    """Change user password."""
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    pw_error = validate_password(request.new_password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    new_hash = hash_password(request.new_password)
    await db.users.update_one({"id": current_user.id}, {"$set": {"password_hash": new_hash}})
    return {"message": "Password changed successfully"}
