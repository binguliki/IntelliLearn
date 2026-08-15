import os

_PROMPTS_DIR = os.path.dirname(__file__)


def load_prompt(name: str) -> str:
    """
    Load a system prompt from the prompts directory.

    Args:
        name: Filename without extension (e.g. "agent_system_prompt")

    Returns:
        The prompt text as a string.

    Raises:
        FileNotFoundError: If the prompt file does not exist.
    """
    path = os.path.join(_PROMPTS_DIR, f"{name}.txt")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Prompt file not found: {path}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
