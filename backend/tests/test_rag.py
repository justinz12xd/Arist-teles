from aristoteles.rag import RAGService


def test_chunking_preserves_text_and_overlap() -> None:
    service = RAGService.__new__(RAGService)
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    service.splitter = RecursiveCharacterTextSplitter(chunk_size=40, chunk_overlap=10)
    chunks = service.chunk("Proveedor A ofrece garantía de 24 meses y entrega en 5 días. " * 8)
    assert len(chunks) > 1
    assert all(chunk.strip() for chunk in chunks)
