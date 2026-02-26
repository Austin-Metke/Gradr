import json
from pathlib import Path
from typing import Optional, Dict

_CONFIG_PATH = Path(__file__).parent / "config.json"

# default configuration
_config: Dict[str, Optional[str]] = {
    "provider": "ollama",
    "model": None,
}

# load persisted config on import
if _CONFIG_PATH.exists():
    try:
        _config.update(json.loads(_CONFIG_PATH.read_text()))
    except Exception:  # pragma: no cover - best effort
        pass


def get_config() -> Dict[str, Optional[str]]:
    return _config.copy()


def set_provider(provider: str, model: Optional[str] = None) -> None:
    _config["provider"] = provider
    _config["model"] = model
    try:
        _CONFIG_PATH.write_text(json.dumps(_config))
    except Exception:  # pragma: no cover
        pass
