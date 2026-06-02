-- ============================================================
-- Tri·log Migration 006 — TEAM & TEAM_MEMBER 接力
-- ============================================================
-- 設計原則（spec 20 / 22.1）：
--   RESULT(result_type=relay) → TEAM → TEAM_MEMBER（1:1:N）
--   換區時間（T1/T2）在 TEAM，屬隊伍層級
--   成員分項時間在 TEAM_MEMBER.split_seconds
--   認領獨立：任一成員可各自認領，互不影響

-- ── TEAM 接力隊伍 ─────────────────────────────────────────────
CREATE TABLE public.teams (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 對應 RESULT 表的隊伍整體成績（1:1）
  result_id       uuid        NOT NULL UNIQUE
                              REFERENCES public.results(id) ON DELETE CASCADE,

  -- 隊名（選填，可跨賽事重複使用）
  team_name       text,

  -- 性別分組（依賽事慣例）
  gender_category text        NOT NULL
                              CHECK (gender_category IN ('male', 'female', 'mixed')),

  -- 隊伍層級換區時間（晶片計時，無法歸屬特定成員）
  t1_seconds      integer     CHECK (t1_seconds IS NULL OR t1_seconds >= 0),
  t2_seconds      integer     CHECK (t2_seconds IS NULL OR t2_seconds >= 0),

  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.teams                  IS '接力隊伍，與 RESULT(result_type=relay) 一對一';
COMMENT ON COLUMN public.teams.result_id        IS '對應的接力整體成績（RESULT）';
COMMENT ON COLUMN public.teams.gender_category  IS 'male / female / mixed';
COMMENT ON COLUMN public.teams.t1_seconds       IS 'T1 換區時間，隊伍層級，無法歸屬個別成員';
COMMENT ON COLUMN public.teams.t2_seconds       IS 'T2 換區時間，隊伍層級';

-- ── TEAM_MEMBER 接力成員 ──────────────────────────────────────
CREATE TABLE public.team_members (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 所屬隊伍
  team_id               uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- 成員帳號（認領前為 null）
  athlete_id            uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,

  -- 姓名快照（策展層建立時記錄，認領後仍保留）
  athlete_name_snapshot text        NOT NULL,

  -- 負責的分項（陣列，如 '{swim}' 或 '{bike,run}'）
  -- 有效值：swim / bike / run
  disciplines           text[]      NOT NULL
                                    CHECK (array_length(disciplines, 1) BETWEEN 1 AND 3),

  -- 成員負責分項的合計純運動時間（不含換區）
  split_seconds         integer     CHECK (split_seconds IS NULL OR split_seconds > 0),

  -- 來源可信度（與 RESULT 相同語意，成員層級）
  source_credibility    text        NOT NULL DEFAULT 'official'
                                    CHECK (source_credibility IN ('official', 'certificate', 'self_reported')),

  -- 認領狀態（成員獨立，互不影響）
  claim_status          text        NOT NULL DEFAULT 'unclaimed'
                                    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'unlinked')),

  -- 公證文件
  certificate_url       text,

  -- 顯示排序（swim=0, bike=1, run=2）
  sort_order            integer     NOT NULL DEFAULT 0,

  claimed_at            timestamptz,
  verified_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.team_members                       IS '接力隊伍成員，認領狀態獨立';
COMMENT ON COLUMN public.team_members.disciplines           IS '負責的分項，如 {swim} 或 {bike,run}';
COMMENT ON COLUMN public.team_members.split_seconds         IS '個人分項合計時間（純運動，不含換區）';
COMMENT ON COLUMN public.team_members.claim_status          IS '成員獨立認領，互不影響其他成員';
COMMENT ON COLUMN public.team_members.source_credibility    IS '繼承自隊伍策展層設定，或成員自行上傳公證';

-- ── 驗證：relay RESULT 必須有對應的 TEAM ─────────────────────
-- 確保 teams.result_id 只能指向 result_type = 'relay' 的成績
CREATE OR REPLACE FUNCTION public.validate_team_result_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.results
    WHERE id = NEW.result_id AND result_type = 'relay'
  ) THEN
    RAISE EXCEPTION 'TEAM 只能對應 result_type = relay 的成績';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_validate_result_type
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.validate_team_result_type();

-- ── Row Level Security：teams ─────────────────────────────────
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 公開讀取
CREATE POLICY "teams_public_read"
  ON public.teams FOR SELECT
  USING (true);

-- 登入用戶可建立（透過 relay 端點，由 Server Action 驗證）
CREATE POLICY "teams_athlete_insert"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 隊伍成員（已認領）或助手可更新隊伍資訊
CREATE POLICY "teams_member_or_assistant_update"
  ON public.teams FOR UPDATE
  USING (
    public.is_assistant_or_above()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN   public.results r ON r.id = teams.result_id
      WHERE  tm.team_id = teams.id
        AND  tm.athlete_id = auth.uid()
        AND  tm.claim_status = 'claimed'
    )
  );

-- Admin 可刪除
CREATE POLICY "teams_admin_delete"
  ON public.teams FOR DELETE
  USING (public.is_admin());

-- ── Row Level Security：team_members ─────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 公開讀取
CREATE POLICY "team_members_public_read"
  ON public.team_members FOR SELECT
  USING (true);

-- 登入用戶可建立（透過 relay 端點）
CREATE POLICY "team_members_athlete_insert"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 本人可更新自己的成員記錄（例：認領、上傳公證）
CREATE POLICY "team_members_self_update"
  ON public.team_members FOR UPDATE
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- 助手以上可更新任何成員記錄（審核公證等）
CREATE POLICY "team_members_assistant_update"
  ON public.team_members FOR UPDATE
  USING (public.is_assistant_or_above())
  WITH CHECK (public.is_assistant_or_above());

-- Admin 可刪除
CREATE POLICY "team_members_admin_delete"
  ON public.team_members FOR DELETE
  USING (public.is_admin());
