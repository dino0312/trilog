-- Ch.48: 用戶引導系統
-- 記錄選手是否已完成 Onboarding Checklist

ALTER TABLE athletes
ADD COLUMN has_completed_onboarding BOOLEAN NOT NULL DEFAULT false;
