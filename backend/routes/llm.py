import logging
from typing import Any, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from models.schemas import User, LLMConfig
from services.auth import get_current_user
from services.llm import get_llm_generate_model, get_llm_chat_model, repair_json
from services.database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/config")
async def get_llm_configs(current_user: User = Depends(get_current_user)):
    configs = await db.llm_configs.find({}, {"_id": 0}).to_list(100)
    active_configs = []
    for config in configs:
        if not config.get("api_key") or config.get("api_key") == "":
            continue
        config["api_key"] = "***"
        config["updated_at"] = config.get("updated_at", datetime.now(timezone.utc).isoformat())
        active_configs.append(config)
    return active_configs


@router.post("/config")
async def save_llm_config(config: LLMConfig, current_user: User = Depends(get_current_user)):
    doc = config.model_dump()
    doc["updated_at"] = doc["updated_at"].isoformat()

    if not config.api_key or config.api_key == "":
        await db.llm_configs.delete_one({"provider": config.provider})
        return {"message": "LLM config deleted"}

    await db.llm_configs.update_one(
        {"provider": config.provider},
        {"$set": doc},
        upsert=True,
    )

    return {"message": "LLM config saved"}


@router.post("/generate")
async def generate_pretext(request: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Generate pretext using LLM."""
    requested_provider = request.get("provider", None)
    prompt = request.get("prompt", "")
    context = request.get("context", {})

    if requested_provider:
        config = await db.llm_configs.find_one(
            {"provider": requested_provider, "enabled": True}, {"_id": 0}
        )
    else:
        config = await db.llm_configs.find_one({"enabled": True}, {"_id": 0})

    if not config:
        raise HTTPException(
            status_code=400,
            detail="LLM provider not configured or not enabled. Please configure in Settings.",
        )

    try:
        response = await get_llm_generate_model(config, prompt, context)
        sanitized = repair_json(response.content)
        return {"generated_text": sanitized, "provider": config["provider"]}

    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        error_msg = str(e)
        if "NOT_FOUND" in error_msg:
            error_msg = (
                "Model not found. Your API Key might not support the selected model, "
                "or the region is restricted."
            )
        raise HTTPException(status_code=500, detail=f"LLM Generation Error: {error_msg}")


@router.post("/chat")
async def chat_interaction(request: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """Real-time Chat Interaction for Roleplay."""
    history = request.get("history", [])
    persona = request.get("persona", {})
    user_message = request.get("message", "")

    config = await db.llm_configs.find_one({"enabled": True}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=400, detail="LLM config missing")

    system_prompt = f"""You are a roleplay actor in a cybersecurity simulation.
    Role: {persona.get('name', 'Attacker')}
    Goal: {persona.get('goal', 'Trick the user')}
    Personality: {persona.get('style', 'Manipulative')}
    Context: {persona.get('context', 'Corporate Environment')}

    INSTRUCTIONS:
    1. Respond naturally as your character. Short, realistic messages (whatsapp/email style).
    2. Do NOT break character.
    3. If the user successfully spots the attack or refuses securely, react accordingly (e.g. get angry, give up, or try a different angle).
    4. If the user FAILS (gives password, clicks link), output a special marker in your text: [SUCCESS_ATTACK].
    5. If the user permanently BLOCKS the attack, output: [ATTACK_FAILED].
    """

    messages = [SystemMessage(content=system_prompt)]

    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=user_message))

    try:
        response = await get_llm_chat_model(config, messages)
        content = response.content

        status = "ongoing"
        if "[SUCCESS_ATTACK]" in content:
            status = "failed"
            content = content.replace("[SUCCESS_ATTACK]", "")
        elif "[ATTACK_FAILED]" in content:
            status = "completed"
            content = content.replace("[ATTACK_FAILED]", "")

        return {"role": "assistant", "content": content, "status": status}

    except Exception as e:
        logger.error(f"Chat error: {e}")
        error_msg = str(e)
        provider = config["provider"]
        if "401" in error_msg:
            error_msg = f"Unauthorized. Please check your API Key for {provider}."
        elif "404" in error_msg:
            error_msg = f"Model Not Found. Provider: {provider}."
        elif "429" in error_msg:
            error_msg = f"Rate Limit Exceeded. Please try again later. Provider: {provider}."
        raise HTTPException(status_code=500, detail=error_msg)
