-- Migration: issue_reports table (Chapter 43)
-- 問題回報系統：選手 / 訪客提交問題，助手在後台管理

CREATE TABLE issue_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text        NOT NULL CHECK (category IN ('add_race', 'result_error', 'other')),
  message         text        NOT NULL,
  submitted_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  submitter_email text,
  context_url     text,
  context_data    jsonb,
  status          text        NOT NULL DEFAULT 'unread'
                              CHECK (status IN ('unread', 'read', 'resolved', 'dismissed')),
  resolved_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at     timestamptz,
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;

-- 任何人都可以提交（含未登入）
CREATE POLICY "Anyone can submit a report"
  ON issue_reports FOR INSERT
  WITH CHECK (true);

-- assistant+ 可讀取
CREATE POLICY "Assistants can read reports"
  ON issue_reports FOR SELECT
  USING (is_assistant_or_above());

-- assistant+ 可更新（狀態、備注）
CREATE POLICY "Assistants can update reports"
  ON issue_reports FOR UPDATE
  USING (is_assistant_or_above());
