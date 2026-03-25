from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import Simulation, User
from services.auth import get_current_user
from services.database import db

router = APIRouter(prefix="/simulations", tags=["simulations"])


@router.post("")
async def create_simulation(simulation: Simulation, current_user: User = Depends(get_current_user)):
    doc = simulation.model_dump()
    doc["started_at"] = doc["started_at"].isoformat()
    if doc.get("completed_at"):
        doc["completed_at"] = doc["completed_at"].isoformat()
    await db.simulations.insert_one(doc)
    return {"id": simulation.id, "status": "created"}


@router.get("", response_model=list[Simulation])
async def get_simulations(current_user: User = Depends(get_current_user)):
    sims = await db.simulations.find({}, {"_id": 0}).sort("started_at", -1).to_list(100)
    return sims


@router.get("/{simulation_id}", response_model=Simulation)
async def get_simulation(simulation_id: str, current_user: User = Depends(get_current_user)):
    sim = await db.simulations.find_one({"id": simulation_id}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return sim


@router.put("/{simulation_id}")
async def update_simulation(
    simulation_id: str, updates: dict[str, Any], current_user: User = Depends(get_current_user)
):
    if updates.get("completed_at"):
        updates["completed_at"] = datetime.now(UTC).isoformat()

    result = await db.simulations.update_one({"id": simulation_id}, {"$set": updates})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {"message": "Simulation updated"}


@router.delete("/{simulation_id}")
async def delete_simulation(simulation_id: str, current_user: User = Depends(get_current_user)):
    result = await db.simulations.delete_one({"id": simulation_id})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {"message": "Simulation deleted successfully"}
