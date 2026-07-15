create extension if not exists vector;

create table public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  case_id uuid not null,
  name text not null check (char_length(name) between 1 and 255),
  source_hash text not null,
  embedding_model text not null,
  status text not null check (status in ('indexing', 'indexed', 'failed')),
  chunk_count integer not null default 0 check (chunk_count >= 0),
  created_at timestamptz not null default now(),
  unique (id, case_id, owner_id),
  unique (owner_id, case_id, source_hash, embedding_model),
  foreign key (case_id, owner_id)
    references public.cases(id, owner_id) on delete cascade
);

create table public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  case_id uuid not null,
  document_id uuid not null,
  page integer not null check (page > 0),
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  content_hash text not null,
  token_count integer not null check (token_count > 0),
  embedding_model text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index, embedding_model),
  foreign key (document_id, case_id, owner_id)
    references public.rag_documents(id, case_id, owner_id) on delete cascade
);

create index rag_documents_owner_case_idx
  on public.rag_documents (owner_id, case_id);
create index rag_chunks_owner_case_idx on public.rag_chunks (owner_id, case_id);
create index rag_chunks_document_idx on public.rag_chunks (document_id);
create index rag_chunks_embedding_hnsw_idx
  on public.rag_chunks using hnsw (embedding vector_cosine_ops);

alter table public.cases force row level security;
alter table public.rag_documents enable row level security;
alter table public.rag_documents force row level security;
alter table public.rag_chunks enable row level security;
alter table public.rag_chunks force row level security;

create policy rag_documents_owner_select
on public.rag_documents
for select to authenticated
using (owner_id = auth.uid());

create policy rag_documents_owner_insert
on public.rag_documents
for insert to authenticated
with check (owner_id = auth.uid());

create policy rag_documents_owner_update
on public.rag_documents
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy rag_documents_owner_delete
on public.rag_documents
for delete to authenticated
using (owner_id = auth.uid());

create policy rag_chunks_owner_select
on public.rag_chunks
for select to authenticated
using (owner_id = auth.uid());

create policy rag_chunks_owner_insert
on public.rag_chunks
for insert to authenticated
with check (owner_id = auth.uid());

create policy rag_chunks_owner_update
on public.rag_chunks
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy rag_chunks_owner_delete
on public.rag_chunks
for delete to authenticated
using (owner_id = auth.uid());

grant select, insert, update, delete on table public.rag_documents to authenticated;
grant select, insert, update, delete on table public.rag_chunks to authenticated;

create function public.match_case_chunks(
  p_case_id uuid,
  p_embedding vector(1536),
  p_embedding_model text,
  p_match_count integer,
  p_match_threshold double precision
)
returns table (
  id uuid,
  document_id uuid,
  document_name text,
  page integer,
  content text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    c.document_id,
    d.name as document_name,
    c.page,
    c.content,
    1 - (c.embedding <=> p_embedding) as similarity
  from public.rag_chunks c
  join public.rag_documents d
    on d.id = c.document_id
   and d.case_id = c.case_id
   and d.owner_id = c.owner_id
  where c.owner_id = auth.uid()
    and d.owner_id = auth.uid()
    and c.case_id = p_case_id
    and d.case_id = p_case_id
    and c.embedding_model = p_embedding_model
    and d.embedding_model = p_embedding_model
    and d.status = 'indexed'
    and 1 - (c.embedding <=> p_embedding) >= p_match_threshold
  order by c.embedding <=> p_embedding
  limit least(greatest(p_match_count, 1), 10)
$$;

revoke execute on function public.match_case_chunks(
  uuid, vector, text, integer, double precision
) from public;
grant execute on function public.match_case_chunks(
  uuid, vector, text, integer, double precision
) to authenticated;
