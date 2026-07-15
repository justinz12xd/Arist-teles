-- Aristóteles foundation: ownership, document evidence, RAG, runs and progress.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  objective TEXT NOT NULL CHECK (char_length(objective) BETWEEN 1 AND 5000),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'running', 'completed', 'needs_review', 'failed', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL CHECK (char_length(filename) BETWEEN 1 AND 512),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/png', 'image/jpeg', 'image/webp')),
  byte_size BIGINT NOT NULL CHECK (byte_size > 0),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-fA-F0-9]{64}$'),
  storage_key TEXT NOT NULL UNIQUE,
  storage_url TEXT NOT NULL,
  extraction_status TEXT NOT NULL DEFAULT 'queued' CHECK (extraction_status IN ('queued', 'extracting', 'completed', 'needs_review', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, sha256),
  CONSTRAINT documents_owner_matches_case FOREIGN KEY (case_id, owner_id)
    REFERENCES public.cases(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE public.document_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  extracted_text TEXT NOT NULL DEFAULT '',
  extraction_method TEXT NOT NULL CHECK (extraction_method IN ('native', 'ocr', 'vision')),
  quality_score NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 1),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, page_number)
);

CREATE TABLE public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.document_pages(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  embedding vector(1536) NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'openai/text-embedding-3-small',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE TABLE public.analysis_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  key TEXT NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  label TEXT NOT NULL,
  weight NUMERIC(6,5) NOT NULL CHECK (weight >= 0 AND weight <= 1),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, key)
);

CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'extracting', 'awaiting_criteria', 'researching', 'comparing', 'deciding', 'reporting', 'completed', 'needs_review', 'failed', 'cancelled')),
  current_stage TEXT,
  progress NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 1),
  checkpoint JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_code TEXT,
  error_message TEXT,
  idempotency_key TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, idempotency_key)
);

CREATE TABLE public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL CHECK (agent_name IN ('planner', 'document', 'research', 'comparison', 'decision')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  error_code TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.document_pages(id) ON DELETE SET NULL,
  chunk_id UUID REFERENCES public.chunks(id) ON DELETE SET NULL,
  claim TEXT NOT NULL,
  quote TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
  advantages JSONB NOT NULL DEFAULT '[]'::jsonb,
  disadvantages JSONB NOT NULL DEFAULT '[]'::jsonb,
  contradictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, provider_id)
);

CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('recommendation', 'needs_review')),
  recommended_provider_id TEXT,
  summary TEXT NOT NULL,
  risk_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id),
  CHECK (outcome = 'needs_review' OR recommended_provider_id IS NOT NULL)
);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  storage_key TEXT,
  storage_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id)
);

CREATE INDEX documents_case_idx ON public.documents (owner_id, case_id);
CREATE INDEX pages_document_idx ON public.document_pages (owner_id, document_id, page_number);
CREATE INDEX chunks_case_idx ON public.chunks (owner_id, case_id, document_id);
CREATE INDEX chunks_embedding_hnsw_idx ON public.chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX runs_case_idx ON public.analysis_runs (owner_id, case_id, created_at DESC);
CREATE INDEX tasks_run_idx ON public.agent_tasks (owner_id, run_id, created_at);
CREATE INDEX evidence_run_idx ON public.evidence (owner_id, run_id, document_id);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['cases', 'documents', 'document_pages', 'chunks', 'analysis_criteria', 'analysis_runs', 'agent_tasks', 'evidence', 'comparisons', 'decisions', 'reports']
  LOOP
    EXECUTE format('CREATE POLICY %I_owner_select ON public.%I FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()))', table_name || '_owner_select', table_name);
    EXECUTE format('CREATE POLICY %I_owner_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()))', table_name || '_owner_insert', table_name);
    EXECUTE format('CREATE POLICY %I_owner_update ON public.%I FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()))', table_name || '_owner_update', table_name);
    EXECUTE format('CREATE POLICY %I_owner_delete ON public.%I FOR DELETE TO authenticated USING (owner_id = (SELECT auth.uid()))', table_name || '_owner_delete', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated;

CREATE POLICY aristoteles_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'case-documents'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  )
  WITH CHECK (
    bucket_id = 'case-documents'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_reports_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'case-reports'
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_reports_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'case-reports'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

CREATE POLICY aristoteles_reports_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'case-reports'
    AND owner_id = (SELECT auth.jwt() ->> 'sub')
    AND (storage.foldername(name))[1] = (SELECT auth.jwt() ->> 'sub')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT USAGE ON SCHEMA storage TO authenticated;

CREATE OR REPLACE FUNCTION public.assert_case_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cases
    WHERE id = NEW.case_id AND owner_id = NEW.owner_id
  ) THEN
    RAISE EXCEPTION 'case ownership mismatch' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_assert_case_owner BEFORE INSERT OR UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER pages_assert_case_owner BEFORE INSERT OR UPDATE ON public.document_pages FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER chunks_assert_case_owner BEFORE INSERT OR UPDATE ON public.chunks FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER criteria_assert_case_owner BEFORE INSERT OR UPDATE ON public.analysis_criteria FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER runs_assert_case_owner BEFORE INSERT OR UPDATE ON public.analysis_runs FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER tasks_assert_case_owner BEFORE INSERT OR UPDATE ON public.agent_tasks FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER evidence_assert_case_owner BEFORE INSERT OR UPDATE ON public.evidence FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER comparisons_assert_case_owner BEFORE INSERT OR UPDATE ON public.comparisons FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER decisions_assert_case_owner BEFORE INSERT OR UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();
CREATE TRIGGER reports_assert_case_owner BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.assert_case_owner();

CREATE OR REPLACE FUNCTION public.match_chunks(
  query_embedding vector(1536),
  p_case_id UUID,
  match_count INTEGER DEFAULT 8,
  match_threshold DOUBLE PRECISION DEFAULT 0.72
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  page_id UUID,
  content TEXT,
  metadata JSONB,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.document_id, c.page_id, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.chunks AS c
  WHERE c.case_id = p_case_id
    AND c.owner_id = (SELECT auth.uid())
    AND 1 - (c.embedding <=> query_embedding) >= match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT LEAST(match_count, 50);
$$;

GRANT EXECUTE ON FUNCTION public.match_chunks(vector, UUID, INTEGER, DOUBLE PRECISION) TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cases_touch_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER documents_touch_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER runs_touch_updated_at BEFORE UPDATE ON public.analysis_runs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

