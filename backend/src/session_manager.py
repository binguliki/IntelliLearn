import os
import time
import threading
from typing import Dict, Tuple

from .client import Agent
from .rag.rag_pipeline import rag_pipeline

# Session TTL in seconds (default: 2 hours). Override via SESSION_TTL_SECONDS env var.
_SESSION_TTL = int(os.getenv("SESSION_TTL_SECONDS", str(2 * 60 * 60)))


class SessionManager:
    """
    Manages per-user Agent instances with TTL-based expiry.

    Each authenticated user gets an isolated Agent (with its own memory/history).
    Sessions that have been idle for longer than SESSION_TTL_SECONDS are
    automatically cleaned up on the next access to avoid unbounded memory growth.

    This is intentionally an in-memory store — it is simple, fast, and correct
    for a single-process deployment. If you need multi-process or persistent
    sessions, replace the internal dict with Redis.
    """

    def __init__(self):
        # Maps user_id -> (Agent instance, last_accessed timestamp)
        self._sessions: Dict[str, Tuple[Agent, float]] = {}
        self._lock = threading.Lock()

    def get_or_create_session(self, user_id: str) -> Agent:
        """
        Return the existing Agent for the user, or create a fresh one.
        Updates the last-accessed timestamp on every call.
        Also triggers expired-session cleanup.
        """
        with self._lock:
            self._cleanup_expired_sessions()

            if user_id in self._sessions:
                agent, _ = self._sessions[user_id]
                self._sessions[user_id] = (agent, time.monotonic())
                return agent

            agent = Agent()
            self._sessions[user_id] = (agent, time.monotonic())
            return agent

    def reset_session(self, user_id: str) -> None:
        """
        Destroy the session for a user, forcing a fresh Agent on next access.
        Also purges any RAG data (Chroma collection + PDF metadata) for the user.
        """
        with self._lock:
            self._sessions.pop(user_id, None)
        rag_pipeline.delete_user_data(user_id)

    def _cleanup_expired_sessions(self) -> None:
        """
        Remove sessions that have been idle longer than SESSION_TTL_SECONDS.
        Also purges RAG data for each expired user.
        Must be called while holding self._lock.
        """
        now = time.monotonic()
        expired = [
            uid
            for uid, (_, last_accessed) in self._sessions.items()
            if now - last_accessed > _SESSION_TTL
        ]
        for uid in expired:
            del self._sessions[uid]
            rag_pipeline.delete_user_data(uid)


# Singleton instance shared across the application lifetime
session_manager = SessionManager()
