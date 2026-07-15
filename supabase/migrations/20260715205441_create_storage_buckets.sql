insert into storage.buckets (id, name, public)
values
  ('case-documents', 'case-documents', false),
  ('case-reports', 'case-reports', false)
on conflict (id) do nothing;
