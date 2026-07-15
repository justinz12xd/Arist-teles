-- Only the owner of an analysis run can subscribe to its progress channel.
ALTER TABLE realtime.channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aristoteles_analysis_subscribe ON realtime.channels;

CREATE POLICY aristoteles_analysis_subscribe
ON realtime.channels
FOR SELECT TO authenticated
USING (
  pattern = 'analysis:%'
  AND EXISTS (
    SELECT 1
    FROM public.analysis_runs
    WHERE id = NULLIF(split_part(realtime.channel_name(), ':', 2), '')::uuid
      AND owner_id = (SELECT auth.uid())
  )
);
