import hashlib
import json
from collections.abc import Sequence

import tiktoken
from langchain_text_splitters import RecursiveCharacterTextSplitter

from aristoteles_api.domain.models import ChunkDraft, DocumentPage


def normalize_text(value: str) -> str:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(line.rstrip() for line in normalized.split("\n")).strip()


def canonical_source_hash(name: str, pages: Sequence[DocumentPage]) -> str:
    payload = {
        "name": name.strip(),
        "pages": [
            {"page": page.page, "text": normalize_text(page.text)}
            for page in sorted(pages, key=lambda item: item.page)
        ],
    }
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return f"sha256:{hashlib.sha256(encoded).hexdigest()}"


class TokenChunker:
    def __init__(self, chunk_tokens: int, overlap_tokens: int) -> None:
        if chunk_tokens <= 0:
            raise ValueError("chunk_tokens must be greater than zero")
        if overlap_tokens < 0:
            raise ValueError("overlap_tokens cannot be negative")
        if overlap_tokens >= chunk_tokens:
            raise ValueError("overlap_tokens must be smaller than chunk_tokens")

        self._encoding = tiktoken.get_encoding("cl100k_base")
        self._splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            encoding_name="cl100k_base",
            chunk_size=chunk_tokens,
            chunk_overlap=overlap_tokens,
        )

    def split(self, pages: Sequence[DocumentPage]) -> list[ChunkDraft]:
        chunks: list[ChunkDraft] = []
        for page in sorted(pages, key=lambda item: item.page):
            for content in self._splitter.split_text(normalize_text(page.text)):
                content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                chunks.append(
                    ChunkDraft(
                        page=page.page,
                        chunk_index=len(chunks),
                        content=content,
                        content_hash=f"sha256:{content_hash}",
                        token_count=len(self._encoding.encode(content)),
                    )
                )
        return chunks
