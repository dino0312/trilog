ALTER TABLE results
ADD COLUMN contributor_consented_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN results.contributor_consented_at IS
  '他人成績 Tab 填寫者勾選同意聲明的時間戳記；自填成績（solo Tab）為 null，作為合法蒐集依據之存證';
