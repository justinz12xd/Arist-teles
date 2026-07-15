create extension if not exists vector;

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  objective text not null check (char_length(objective) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (owner_id, id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  case_id uuid not null,
  name text not null check (char_length(name) between 1 and 255),
  source_hash text not null,
  embedding_model text not null,
  status text not null check (status in ('indexing', 'indexed', 'failed')),
  chunk_count integer not null default 0 check (chunk_count >= 0),
  created_at timestamptz not null default now(),
  unique (owner_id, case_id, id),
  unique (owner_id, case_id, source_hash, embedding_model),
  foreign key (owner_id, case_id)
    references public.cases(owner_id, id) on delete cascade
);

create table public.chunks (
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
  foreign key (owner_id, case_id, document_id)
    references public.documents(owner_id, case_id, id) on delete cascade
);

create index documents_owner_case_idx on public.documents (owner_id, case_id);
create index chunks_owner_case_idx on public.chunks (owner_id, case_id);
create index chunks_document_idx on public.chunks (document_id);
create index chunks_embedding_hnsw_idx
  on public.chunks using hnsw (embedding vector_cosine_ops);

alter table public.cases enable row level security;
alter table public.cases force row level security;
alter table public.documents enable row level security;
alter table public.documents force row level security;
alter table public.chunks enable row level security;
alter table public.chunks force row level security;

create policy cases_owner_select
on public.cases
for select to authenticated
using (owner_id = auth.uid());

create policy cases_owner_insert
on public.cases
for insert to authenticated
with check (owner_id = auth.uid());

create policy cases_owner_update
on public.cases
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy cases_owner_delete
on public.cases
for delete to authenticated
using (owner_id = auth.uid());

create policy documents_owner_select
on public.documents
for select to authenticated
using (owner_id = auth.uid());

create policy documents_owner_insert
on public.documents
for insert to authenticated
with check (owner_id = auth.uid());

create policy documents_owner_update
on public.documents
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy documents_owner_delete
on public.documents
for delete to authenticated
using (owner_id = auth.uid());

create policy chunks_owner_select
on public.chunks
for select to authenticated
using (owner_id = auth.uid());

create policy chunks_owner_insert
on public.chunks
for insert to authenticated
with check (owner_id = auth.uid());

create policy chunks_owner_update
on public.chunks
for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy chunks_owner_delete
on public.chunks
for delete to authenticated
using (owner_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.cases to authenticated;
grant select, insert, update, delete on table public.documents to authenticated;
grant select, insert, update, delete on table public.chunks to authenticated;

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
  from public.chunks c
  join public.documents d
    on d.owner_id = c.owner_id
   and d.case_id = c.case_id
   and d.id = c.document_id
  where c.owner_id = auth.uid()
    and c.case_id = p_case_id
    and c.embedding_model = p_embedding_model
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
