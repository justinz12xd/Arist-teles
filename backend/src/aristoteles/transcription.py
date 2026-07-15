"""Server-side speech-to-text using OpenAI Whisper."""

from typing import Any

from openai import AsyncOpenAI

from .config import Settings


class WhisperTranscriptionService:
    def __init__(self, settings: Settings, client: AsyncOpenAI | None = None) -> None:
        self.settings = settings
        if client is not None:
            self.client = client
        else:
            if settings.openai_api_key is None:
                raise RuntimeError("OPENAI_API_KEY is required for audio transcription")
            self.client = AsyncOpenAI(api_key=settings.openai_api_key.get_secret_value())

    async def transcribe(
        self,
        *,
        filename: str,
        content_type: str,
        audio: bytes,
        language: str = "es",
    ) -> str:
        response: Any = await self.client.audio.transcriptions.create(
            model=self.settings.openai_transcribe_model,
            file=(filename, audio, content_type),
            language=language,
            response_format="json",
            temperature=0,
        )
        text = str(getattr(response, "text", "") or "").strip()
        if not text:
            raise RuntimeError("Whisper returned an empty transcription")
        return text
