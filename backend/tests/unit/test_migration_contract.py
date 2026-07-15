import re
from pathlib import Path


def test_rag_migration_contains_vector_and_rls_contract() -> None:
    root = Path(__file__).resolve().parents[3]
    sql = (root / "migrations" / "20260715000000_create_rag_core.sql").read_text(
        encoding="utf-8"
    )
    normalized = " ".join(sql.lower().split())

    assert "create extension if not exists vector" in normalized
    assert normalized.count("create table public.") == 3
    assert "embedding vector(1536) not null" in normalized
    assert "default auth.uid() references auth.users(id) on delete cascade" in normalized
    assert normalized.count("default auth.uid()") == 3
    assert "objective text not null check (char_length(objective) between 1 and 2000)" in normalized
    assert "name text not null check (char_length(name) between 1 and 255)" in normalized
    assert "unique (owner_id, id)" in normalized
    assert "unique (owner_id, case_id, id)" in normalized
    assert "unique (owner_id, case_id, source_hash, embedding_model)" in normalized
    assert "unique (document_id, chunk_index, embedding_model)" in normalized
    assert (
        "foreign key (owner_id, case_id) references public.cases(owner_id, id) "
        "on delete cascade"
    ) in normalized
    assert (
        "foreign key (owner_id, case_id, document_id) references "
        "public.documents(owner_id, case_id, id) on delete cascade"
    ) in normalized

    assert "status in ('indexing', 'indexed', 'failed')" in normalized
    assert "check (chunk_count >= 0)" in normalized
    assert "check (page > 0)" in normalized
    assert "check (chunk_index >= 0)" in normalized
    assert "check (token_count > 0)" in normalized
    assert "on public.documents (owner_id, case_id)" in normalized
    assert "on public.chunks (owner_id, case_id)" in normalized
    assert "on public.chunks (document_id)" in normalized
    assert "using hnsw (embedding vector_cosine_ops)" in normalized

    assert normalized.count("enable row level security") == 3
    assert normalized.count("force row level security") == 3
    assert normalized.count("create policy") == 12
    assert normalized.count("for select to authenticated") == 3
    assert normalized.count("for insert to authenticated") == 3
    assert normalized.count("for update to authenticated") == 3
    assert normalized.count("for delete to authenticated") == 3
    assert normalized.count("with check (owner_id = auth.uid())") == 6
    assert normalized.count("using (owner_id = auth.uid())") == 9
    for table in ("cases", "documents", "chunks"):
        assert f"alter table public.{table} enable row level security" in normalized
        assert f"alter table public.{table} force row level security" in normalized
        assert (
            f"grant select, insert, update, delete on table public.{table} to authenticated"
            in normalized
        )
        for operation in ("select", "insert", "update", "delete"):
            assert (
                f"create policy {table}_owner_{operation} on public.{table} "
                f"for {operation} to authenticated"
            ) in normalized
    assert "grant all" not in normalized

    assert "create function public.match_case_chunks" in normalized
    assert "security invoker" in normalized
    assert "set search_path = ''" in normalized
    assert "where c.owner_id = auth.uid()" in normalized
    assert "and c.case_id = p_case_id" in normalized
    assert "and c.embedding_model = p_embedding_model" in normalized
    assert "and d.status = 'indexed'" in normalized
    assert "on d.owner_id = c.owner_id and d.case_id = c.case_id" in normalized
    assert "and d.id = c.document_id" in normalized
    assert "and 1 - (c.embedding <=> p_embedding) >= p_match_threshold" in normalized
    assert "limit least(greatest(p_match_count, 1), 10)" in normalized
    assert "security definer" not in normalized
    assert "revoke execute on function public.match_case_chunks" in normalized
    assert ") from public; grant execute on function public.match_case_chunks" in normalized
    assert ") to authenticated;" in normalized

    assert re.search(r"\b(begin|commit)\b", normalized) is None
