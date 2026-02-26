import os
import json
import random
from typing import Optional

try:
    from ..config import get_config
except ImportError:
    from config import get_config

try:
    import openai
except ImportError:  # OpenAI optional
    openai = None

try:
    import anthropic
except ImportError:  # Anthropic optional
    anthropic = None


class LLMProvider:
    def __init__(self):
        # provider selection read on every call to allow runtime changes
        pass

    async def complete(self, user_prompt: str, system_prompt: Optional[str] = None) -> str:
        cfg = get_config()
        provider = cfg.get("provider")
        model = cfg.get("model")
        prompt = ""
        if system_prompt:
            prompt += system_prompt + "\n"
        prompt += user_prompt

        # route to selected provider if available
        if provider == "openai" and openai is not None:
            try:
                client = openai
                # using the new OpenAI python library
                response = client.ChatCompletion.create(
                    model=model or os.getenv("OPENAI_MODEL", "gpt-4o"),
                    messages=[
                        {"role": "system", "content": system_prompt or ""},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.2,
                )
                return response.choices[0].message.content
            except Exception as e:  # pragma: no cover
                print("openai request failed", e)
        elif provider == "anthropic" and anthropic is not None:
            try:
                client = anthropic.Client(api_key=os.getenv("ANTHROPIC_API_KEY"))
                response = client.completions.create(
                    model=model or "claude-3.5-mini",
                    max_tokens=1000,
                    prompt=anthropic.HUMAN_PROMPT + prompt + anthropic.AI_PROMPT,
                )
                return response.completion
            except Exception as e:  # pragma: no cover
                print("anthropic request failed", e)
        # stub fallback: produce simple JSON structure
        fallback = {
            "recommended_grade": random.choice([0, 50, 100]),
            "confidence": random.choice(["high", "medium", "low"]),
            "meets_requirements": [],
            "code_quality": {"runs": True, "logic_correct": True, "style_acceptable": True, "issues": []},
            "feedback": "This is an auto-generated placeholder grade.",
            "ta_notes": "",
        }
        return json.dumps(fallback)
