from collections.abc import Iterable

from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI

from .config import Settings
from .insforge import InsForgeRepository


class RAGService:
    def __init__(self, settings: Settings, repository: InsForgeRepository):
        self.settings = settings
        self.repository = repository
        self.splitter = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=120)
        if settings.openai_api_key is None:
            raise RuntimeError("OPENAI_API_KEY is required for RAG execution")
        self.client = AsyncOpenAI(api_key=settings.openai_api_key.get_secret_value())

    def chunk(self, text: str) -> list[str]:
        return self.splitter.split_text(text)

    async def embed(self, texts: Iterable[str]) -> list[list[float]]:
        values = list(texts)
        if not values:
            return []
        response = await self.client.embeddings.create(
            model=self.settings.openai_embedding_model,
            input=values,
        )
        return [item.embedding for item in response.data]

    async def store_page_chunks(
        self,
        *,
        owner_id: str,
        case_id: str,
        document_id: str,
        page_id: str,
        text: str,
    ) -> int:
        chunks = self.chunk(text)
        embeddings = await self.embed(chunks)
        for index, (content, embedding) in enumerate(zip(chunks, embeddings, strict=True)):
            await self.repository.insert(
                "chunks",
                {
                    "owner_id": owner_id,
                    "case_id": case_id,
                    "document_id": document_id,
                    "page_id": page_id,
                    "chunk_index": index,
                    "content": content,
                    "embedding": embedding,
                    "embedding_model": self.settings.openai_embedding_model,
                },
            )
        return len(chunks)

    async def search(self, *, case_id: str, query: str, limit: int = 8) -> list[dict]:
        embedding = (await self.embed([query]))[0]
        return await self.repository.rpc(
            "match_chunks",
            {
                "query_embedding": embedding,
                "p_case_id": case_id,
                "match_count": min(limit, 50),
                "match_threshold": self.settings.min_retrieval_score,
            },
        )
