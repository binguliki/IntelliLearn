import os
from typing import Any

from langchain_google_genai import ChatGoogleGenerativeAI

from .base import ModelProvider


class GeminiProvider(ModelProvider):
    """
    LLM provider backed by Google Gemini via LangChain.

    Configuration (read from environment):
        MODEL_NAME        - Gemini model ID (default: gemini-2.0-flash)
        MODEL_TEMPERATURE - Sampling temperature (default: 0.7)
    """

    def __init__(self):
        self.model_name = os.getenv("MODEL_NAME", "gemini-2.0-flash")
        self.temperature = float(os.getenv("MODEL_TEMPERATURE", "0.7"))

    def get_llm(self, tools: list) -> Any:
        """
        Return a Gemini chat model with the given tools bound.
        """
        model = ChatGoogleGenerativeAI(
            model=self.model_name,
            temperature=self.temperature,
        )
        return model.bind_tools(tools)
