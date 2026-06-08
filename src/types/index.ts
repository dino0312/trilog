// ============================================================
// Tri·log — 共用業務型別
// 從 database.ts 的底層型別組合出應用層所需的型別
// ============================================================

export type {
  Role,
  RaceStatus,
  DistanceCategory,
  SourceCredibility,
  ClaimStatus,
  ResultType,
  GenderCategory,
  Gender,
  EditorRole,
  WeatherData,
  WeatherSource,
  SwimType,
} from './database'

// ── 應用層組合型別 ────────────────────────────────────────────

export interface Athlete {
  id:          string
  name:        string | null
  nickname:    string | null
  gender:      'M' | 'F' | null
  birth_year:  number | null
  nationality: string | null
  bio:         string | null
  avatar_url:  string | null
  is_minor:    boolean
  role:        'athlete' | 'assistant' | 'admin'
}

export interface Race {
  id:       string
  name:     string
  slug:     string
  status:   'active' | 'inactive' | 'cancelled'
  country:  string | null
  city:     string | null
  lat:      number | null
  lng:      number | null
}

export interface RaceEdition {
  id:                 string
  race_id:            string
  year:               number
  race_date:          string
  distance_category:  'sprint' | 'olympic' | '70.3' | 'full'
  weather_data:       import('./database').WeatherData | null
  finisher_count:     number | null
  race?:              Race
}

export interface Result {
  id:                    string
  result_type:           'solo' | 'relay'
  race_edition_id:       string
  athlete_id:            string | null
  athlete_name_snapshot: string | null
  source_credibility:    'official' | 'certificate' | 'self_reported'
  claim_status:          'unclaimed' | 'pending' | 'claimed' | 'unlinked'
  total_seconds:         number
  swim_seconds:          number | null
  t1_seconds:            number | null
  bike_seconds:          number | null
  t2_seconds:            number | null
  run_seconds:           number | null
  is_public:             boolean
  certificate_url:       string | null
  claim_tag_count:       number
  overall_rank:          number | null
  ag_rank:               number | null
  notes:                 string | null
  claimed_at:            string | null
  verified_at:           string | null
  created_at:            string
  race_edition?:         RaceEdition
  athlete?:              Athlete
}

/** 排行榜單一列（來自 leaderboard_entries view + RANK window function） */
export interface LeaderboardRow {
  rank:              number
  result_id:         string
  total_seconds:     number
  swim_seconds:      number | null
  t1_seconds:        number | null
  bike_seconds:      number | null
  t2_seconds:        number | null
  run_seconds:       number | null
  source_credibility:'official' | 'certificate' | 'self_reported'
  claim_status:      'unclaimed' | 'pending' | 'claimed' | 'unlinked'
  claim_tag_count:   number
  display_name:      string | null
  nationality:       string | null
  gender:            'M' | 'F' | null
  age_group:         string | null      // 如 'M30-34'
  avatar_url:        string | null
  athlete_id:        string | null
  edition_year:      number
  race_date:         string
  distance_category: 'sprint' | 'olympic' | '70.3' | 'full'
  race_name:         string
  race_slug:         string
  delta_seconds?:    number            // 與第一名的差距（前端計算）
  is_me?:            boolean           // 登入用戶自己的成績
}

/** 排行榜篩選條件 */
export interface LeaderboardFilters {
  distance:    'sprint' | 'olympic' | '70.3' | 'full'
  gender?:     'M' | 'F'
  age_group?:  string              // 如 'M30-34'
  nationality?: string             // ISO 3166-1 alpha-3
  race_id?:    string
  mode?:       'leaderboard' | 'records'  // spec 21.1
}

/** 接力隊伍成員 */
export interface TeamMember {
  id:                    string
  team_id:               string
  athlete_id:            string | null
  athlete_name_snapshot: string
  disciplines:           string[]
  split_seconds:         number | null
  source_credibility:    'official' | 'certificate' | 'self_reported'
  claim_status:          'unclaimed' | 'pending' | 'claimed' | 'unlinked'
  sort_order:            number
  athlete?:              Athlete
}

/** 接力隊伍（含成員） */
export interface Team {
  id:              string
  result_id:       string
  team_name:       string | null
  gender_category: 'male' | 'female' | 'mixed'
  t1_seconds:      number | null
  t2_seconds:      number | null
  members?:        TeamMember[]
}

/** 成績新增表單資料（社群層 solo） */
export interface NewResultForm {
  race_edition_id: string
  total_seconds:   number
  swim_seconds?:   number
  t1_seconds?:     number
  bike_seconds?:   number
  t2_seconds?:     number
  run_seconds?:    number
  is_public:       boolean
  notes?:          string
  bib_number?:     string
}
