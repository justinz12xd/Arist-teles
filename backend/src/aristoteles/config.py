"""Compatibility exports for the established analysis pipeline.

All runtime configuration now lives in ``aristoteles_api.core.config`` so the
RAG API and multi-agent pipeline cannot drift to different providers or models.
"""

from aristoteles_api.core.config import Settings, get_settings

__all__ = ["Settings", "get_settings"]
