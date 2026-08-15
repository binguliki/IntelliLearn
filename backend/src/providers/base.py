from abc import ABC, abstractmethod
from typing import Any


class ModelProvider(ABC):
    """
    Abstract base class for LLM model providers.

    Implement this interface to add a new model backend (e.g. OpenAI, Anthropic).
    The Agent class depends only on this interface — swapping providers requires
    changing the MODEL_PROVIDER env var, not the Agent code.
    """

    @abstractmethod
    def get_llm(self, tools: list) -> Any:
        """
        Return a LangChain-compatible chat model instance with tools bound.

        Args:
            tools: List of LangChain tool callables to bind to the model.

        Returns:
            A LangChain Runnable (e.g. ChatModel.bind_tools(tools)).
        """
        ...
