from aristoteles_api.domain.models import DocumentPage
from aristoteles_api.rag.chunking import TokenChunker, canonical_source_hash, normalize_text


def test_normalize_text_changes_only_line_endings_and_surrounding_whitespace() -> None:
    assert normalize_text("  Alpha  \r\nBeta\t\r\n\r\n") == "Alpha\nBeta"


def test_hash_is_stable_across_line_endings_trailing_spaces_and_page_order() -> None:
    unix = [DocumentPage(page=1, text="Alpha\nBeta"), DocumentPage(page=2, text="Gamma")]
    windows = [
        DocumentPage(page=2, text="Gamma\r\n"),
        DocumentPage(page=1, text="Alpha  \r\nBeta\r\n"),
    ]

    assert canonical_source_hash("quote.pdf", unix) == canonical_source_hash(
        " quote.pdf ", windows
    )


def test_chunker_never_mixes_pages_and_uses_global_indexes() -> None:
    chunker = TokenChunker(chunk_tokens=20, overlap_tokens=5)
    pages = [
        DocumentPage(page=1, text="alpha " * 30),
        DocumentPage(page=2, text="beta " * 30),
    ]

    chunks = chunker.split(pages)

    assert {chunk.page for chunk in chunks} == {1, 2}
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))
    assert all(chunk.token_count <= 20 for chunk in chunks)
    assert all("alpha" not in chunk.content for chunk in chunks if chunk.page == 2)


def test_chunking_is_reproducible_and_hashes_are_prefixed() -> None:
    chunker = TokenChunker(chunk_tokens=12, overlap_tokens=3)
    pages = [DocumentPage(page=1, text="evidence " * 25)]

    first = chunker.split(pages)
    second = chunker.split(pages)

    assert first == second
    assert all(chunk.content_hash.startswith("sha256:") for chunk in first)
