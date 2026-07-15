from types import SimpleNamespace

import pytest

from aristoteles.transcription import WhisperTranscriptionService
from aristoteles_api.core.config import Settings


class _FakeTranscriptions:
    def __init__(self) -> None:
        self.request: dict | None = None

    async def create(self, **kwargs):  # type: ignore[no-untyped-def]
        self.request = kwargs
        return SimpleNamespace(text="Compara las propuestas por garantía.")


class _FakeClient:
    def __init__(self) -> None:
        self.audio = SimpleNamespace(transcriptions=_FakeTranscriptions())


@pytest.mark.asyncio
async def test_whisper_transcribes_spanish_audio_with_server_key_hidden() -> None:
    client = _FakeClient()
    service = WhisperTranscriptionService(
        Settings(_env_file=None, openai_transcribe_model="whisper-1"),
        client=client,  # type: ignore[arg-type]
    )

    text = await service.transcribe(
        filename="recording.webm",
        content_type="audio/webm",
        audio=b"audio-bytes",
    )

    assert text == "Compara las propuestas por garantía."
    assert client.audio.transcriptions.request is not None
    assert client.audio.transcriptions.request["model"] == "whisper-1"
    assert client.audio.transcriptions.request["language"] == "es"
    assert client.audio.transcriptions.request["file"] == (
        "recording.webm",
        b"audio-bytes",
        "audio/webm",
    )
