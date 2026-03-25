import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

# Default model mappings
MODEL_DEFAULTS = {
    "gemini": "gemini-1.5-flash",
    "claude": "claude-3-5-sonnet-20240620",
    "groq": "llama-3.3-70b-versatile",
}

GEMINI_FALLBACK_MODELS = [
    "gemini-1.5-flash",
    "models/gemini-1.5-flash",
    "gemini-pro",
    "models/gemini-pro",
]


def sanitize_llm_output(text: str) -> str:
    """Remove markdown code blocks and training markers from LLM output."""
    text = re.sub(r"```(?:json)?", "", text)
    text = text.replace("```", "")
    text = text.replace("[TRAINING]", "").replace("[TRAINING MATERIAL]", "")
    return text.strip()


def repair_json(text: str) -> str:
    """Attempt to repair and extract valid JSON from LLM output."""
    text = sanitize_llm_output(text)

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:
        text = text[start : end + 1]

    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass

    return text


async def _invoke_gemini(api_key: str, model_name: str, messages: list, temperature: float = 0.7):
    """Invoke Gemini with fallback model strategy."""
    from langchain_google_genai import ChatGoogleGenerativeAI

    model_candidates = [model_name] + GEMINI_FALLBACK_MODELS
    # Deduplicate preserving order
    model_candidates = list(dict.fromkeys(model_candidates))

    last_error = None
    for candidate in model_candidates:
        try:
            logger.info(f"Attempting Gemini with model: {candidate}")
            convert_system = "1.5" not in candidate
            chat = ChatGoogleGenerativeAI(
                google_api_key=api_key,
                model=candidate,
                temperature=temperature,
                convert_system_message_to_human=convert_system,
            )
            response = await asyncio.wait_for(chat.ainvoke(messages), timeout=15.0)
            if response:
                logger.info(f"Success with model: {candidate}")
                return response
        except asyncio.TimeoutError:
            logger.warning(f"Timeout with model {candidate}")
            last_error = Exception(f"Request timed out for {candidate}")
        except Exception as e:
            logger.warning(f"Failed with model {candidate}: {e}")
            last_error = e

    raise last_error or Exception("All Gemini models failed")


async def get_llm_generate_model(config: Dict[str, Any], prompt: str, context: Dict[str, Any]):
    """Generate pretext content using configured LLM provider."""
    provider = config["provider"]
    api_key = config["api_key"]
    model_name = config.get("model_name") or MODEL_DEFAULTS.get(provider, "gemini-1.5-flash")

    context_str = json.dumps(context, indent=2) if isinstance(context, dict) else str(context)
    system_message = SystemMessage(
        content=(
            "You are a social engineering pretext generator. Generate realistic, "
            "ethically-sound pretexts for security awareness training. Always mark "
            "outputs as training material.\n\nContext: " + context_str + "\n\n"
        )
    )
    user_message = HumanMessage(content=prompt)
    messages = [system_message, user_message]

    if provider == "gemini":
        return await _invoke_gemini(api_key, model_name, messages)
    elif provider == "claude":
        from langchain_anthropic import ChatAnthropic

        chat = ChatAnthropic(api_key=api_key, model=model_name, temperature=0.7)
        return await chat.ainvoke(messages)
    else:
        raise ValueError(f"Unsupported provider: {provider}")


async def get_llm_chat_model(config: Dict[str, Any], messages: list):
    """Chat interaction using configured LLM provider."""
    provider = config["provider"]
    api_key = config["api_key"]

    if provider == "groq":
        from langchain_groq import ChatGroq

        chat = ChatGroq(
            api_key=api_key,
            model_name=MODEL_DEFAULTS["groq"],
            temperature=0.7,
        )
        return await chat.ainvoke(messages)

    elif provider == "gemini":
        model_name = config.get("model_name") or MODEL_DEFAULTS["gemini"]
        return await _invoke_gemini(api_key, model_name, messages, temperature=0.8)

    elif provider == "claude":
        from langchain_anthropic import ChatAnthropic

        model_name = config.get("model_name") or MODEL_DEFAULTS["claude"]
        chat = ChatAnthropic(api_key=api_key, model=model_name)
        return await chat.ainvoke(messages)

    else:
        # Default fallback to Groq
        from langchain_groq import ChatGroq

        chat = ChatGroq(api_key=api_key, model_name="llama3-70b-8192")
        return await chat.ainvoke(messages)
