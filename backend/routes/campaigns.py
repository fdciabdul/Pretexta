from typing import Any, Dict, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from models.schemas import User, Campaign, CampaignProgress
from services.auth import get_current_user
from services.database import db
from services.gamification import award_xp

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("")
async def get_campaigns(current_user: User = Depends(get_current_user)):
    """List all published campaigns."""
    campaigns = await db.campaigns.find(
        {"is_published": True}, {"_id": 0}
    ).to_list(100)
    return campaigns


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: User = Depends(get_current_user)):
    """Get campaign details with user progress."""
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    progress = await db.campaign_progress.find_one(
        {"campaign_id": campaign_id, "user_id": current_user.id}, {"_id": 0}
    )

    return {"campaign": campaign, "progress": progress}


@router.post("")
async def create_campaign(data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Create a new campaign (admin/instructor only)."""
    if current_user.role not in ("admin", "instructor"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    campaign = Campaign(
        title=data["title"],
        description=data.get("description", ""),
        difficulty=data.get("difficulty", "medium"),
        stages=data.get("stages", []),
        cialdini_categories=data.get("cialdini_categories", []),
        estimated_time=data.get("estimated_time", 30),
        created_by=current_user.id,
        is_published=data.get("is_published", False),
    )
    doc = campaign.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.campaigns.insert_one(doc)
    return {"id": campaign.id, "message": "Campaign created"}


@router.post("/{campaign_id}/start")
async def start_campaign(campaign_id: str, current_user: User = Depends(get_current_user)):
    """Start a campaign."""
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Check if already in progress
    existing = await db.campaign_progress.find_one(
        {"campaign_id": campaign_id, "user_id": current_user.id, "status": "in_progress"}
    )
    if existing:
        return {"progress_id": existing["id"], "message": "Campaign already in progress"}

    progress = CampaignProgress(
        campaign_id=campaign_id,
        user_id=current_user.id,
    )
    doc = progress.model_dump()
    doc["started_at"] = doc["started_at"].isoformat()
    await db.campaign_progress.insert_one(doc)

    return {"progress_id": progress.id, "message": "Campaign started", "first_stage": 0}


@router.post("/{campaign_id}/stage/{stage_index}/complete")
async def complete_stage(
    campaign_id: str,
    stage_index: int,
    result: Dict[str, Any],
    current_user: User = Depends(get_current_user),
):
    """Complete a campaign stage."""
    progress = await db.campaign_progress.find_one(
        {"campaign_id": campaign_id, "user_id": current_user.id, "status": "in_progress"},
        {"_id": 0},
    )
    if not progress:
        raise HTTPException(status_code=404, detail="No active campaign progress")

    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Add stage result
    stage_result = {
        "stage_index": stage_index,
        "score": result.get("score", 0),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "events": result.get("events", []),
    }

    stage_results = progress.get("stage_results", [])
    stage_results.append(stage_result)

    # Check if campaign is complete
    total_stages = len(campaign.get("stages", []))
    next_stage = stage_index + 1
    is_complete = next_stage >= total_stages

    updates = {
        "stage_results": stage_results,
        "current_stage": next_stage,
    }

    if is_complete:
        updates["status"] = "completed"
        updates["completed_at"] = datetime.now(timezone.utc).isoformat()
        # Calculate overall score
        all_scores = [r.get("score", 0) for r in stage_results]
        updates["overall_score"] = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

        # Award XP for campaign completion
        xp_earned = 100 + (updates["overall_score"] // 10) * 10
        await award_xp(current_user.id, int(xp_earned))
    else:
        # Award XP per stage
        await award_xp(current_user.id, 25)

    await db.campaign_progress.update_one(
        {"id": progress["id"]},
        {"$set": updates},
    )

    return {
        "message": "Stage completed" if not is_complete else "Campaign completed!",
        "next_stage": next_stage if not is_complete else None,
        "is_complete": is_complete,
        "overall_score": updates.get("overall_score"),
    }
