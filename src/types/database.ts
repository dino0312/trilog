// ============================================================
// Tri·log — Supabase Database 型別定義
// 對應 supabase/migrations/ 的最終 Schema
// 可用 `npx supabase gen types typescript --local` 自動重新產生
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ── Enum-like types ──────────────────────────────────────────

export type Role               = 'athlete' | 'assistant' | 'admin'
export type RaceStatus         = 'active' | 'inactive' | 'cancelled'
export type DistanceCategory   = 'sprint' | 'olympic' | '70.3' | 'full'
export type WeatherSource      = 'open-meteo' | 'visual-crossing' | 'manual'
export type SwimType           = 'ocean' | 'lake' | 'river' | 'pool' | 'other'
export type ResultType         = 'solo' | 'relay'
/** spec 22.2：取代舊 source_type + verification_status */
export type SourceCredibility  = 'official' | 'certificate' | 'self_reported'
/** spec 21.4：含 unlinked 隱私衝突解法 */
export type ClaimStatus        = 'unclaimed' | 'pending' | 'claimed' | 'unlinked'
export type GenderCategory     = 'male' | 'female' | 'mixed'
export type Gender             = 'M' | 'F'
export type EditorRole         = 'editor' | 'organizer'

// ── Weather data JSON structure ──────────────────────────────
export interface WeatherData {
  temp_c?:           number
  humidity_pct?:     number
  wind_speed_ms?:    number
  wind_direction?:   string
  precipitation_mm?: number
  [key: string]:     Json | undefined
}

// ============================================================
// Database type map (for createClient<Database>)
// ============================================================

export type Database = {
  public: {
    Tables: {

      // ── athletes ──────────────────────────────────────────
      athletes: {
        Row: {
          id:          string
          email:       string
          nickname:    string | null
          gender:      Gender | null
          birth_year:  number | null
          nationality: string | null
          bio:         string | null
          avatar_url:  string | null
          is_minor:    boolean
          role:        Role
          created_at:  string
          updated_at:  string
          deleted_at:  string | null
        }
        Insert: {
          id:           string
          email:        string
          nickname?:    string | null
          gender?:      Gender | null
          birth_year?:  number | null
          nationality?: string | null
          bio?:         string | null
          avatar_url?:  string | null
          is_minor?:    boolean
          role?:        Role
          deleted_at?:  string | null
        }
        Update: Partial<Database['public']['Tables']['athletes']['Insert']>
        Relationships: []
      }

      // ── races ────────────────────────────────────────────
      races: {
        Row: {
          id:         string
          name:       string
          slug:       string
          status:     RaceStatus
          country:    string | null
          city:       string | null
          lat:        number | null
          lng:        number | null
          organizer:  string | null
          website:    string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:         string
          name:        string
          slug:        string
          status?:     RaceStatus
          country?:    string | null
          city?:       string | null
          lat?:        number | null
          lng?:        number | null
          organizer?:  string | null
          website?:    string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['races']['Insert']>
        Relationships: []
      }

      // ── race_editions ────────────────────────────────────
      race_editions: {
        Row: {
          id:                 string
          race_id:            string
          year:               number
          race_date:          string
          distance_category:  DistanceCategory
          swim_distance_m:    number | null
          bike_distance_km:   number | null
          run_distance_km:    number | null
          is_wetsuit_allowed: boolean | null
          water_temp_c:       number | null
          swim_type:          SwimType | null
          weather_source:     WeatherSource | null
          weather_data:       WeatherData | null
          finisher_count:     number | null
          dnf_count:          number | null
          total_starters:     number | null
          notes:              string | null
          created_at:         string
          updated_at:         string
        }
        Insert: {
          id?:                 string
          race_id:             string
          year:                number
          race_date:           string
          distance_category:   DistanceCategory
          swim_distance_m?:    number | null
          bike_distance_km?:   number | null
          run_distance_km?:    number | null
          is_wetsuit_allowed?: boolean | null
          water_temp_c?:       number | null
          swim_type?:          SwimType | null
          weather_source?:     WeatherSource | null
          weather_data?:       WeatherData | null
          finisher_count?:     number | null
          dnf_count?:          number | null
          total_starters?:     number | null
          notes?:              string | null
        }
        Update: Partial<Database['public']['Tables']['race_editions']['Insert']>
        Relationships: []
      }

      // ── results ──────────────────────────────────────────
      results: {
        Row: {
          id:                    string
          result_type:           ResultType
          race_edition_id:       string
          athlete_id:            string | null
          athlete_name_snapshot: string | null
          source_credibility:    SourceCredibility
          claim_status:          ClaimStatus
          total_seconds:         number
          swim_seconds:          number | null
          t1_seconds:            number | null
          bike_seconds:          number | null
          t2_seconds:            number | null
          run_seconds:           number | null
          curated_gender:        Gender | null
          is_public:             boolean
          certificate_url:       string | null
          claim_tag_count:       number
          overall_rank:          number | null
          ag_rank:               number | null
          bib_number:            string | null
          notes:                 string | null
          claimed_at:            string | null
          verified_at:           string | null
          created_at:            string
          updated_at:            string
        }
        Insert: {
          id?:                    string
          result_type:            ResultType
          race_edition_id:        string
          athlete_id?:            string | null
          athlete_name_snapshot?: string | null
          source_credibility:     SourceCredibility
          claim_status?:          ClaimStatus
          total_seconds:          number
          swim_seconds?:          number | null
          t1_seconds?:            number | null
          bike_seconds?:          number | null
          t2_seconds?:            number | null
          run_seconds?:           number | null
          curated_gender?:        Gender | null
          is_public?:             boolean
          certificate_url?:       string | null
          overall_rank?:          number | null
          ag_rank?:               number | null
          bib_number?:            string | null
          notes?:                 string | null
          claimed_at?:            string | null
          verified_at?:           string | null
        }
        Update: Partial<Database['public']['Tables']['results']['Insert']>
        Relationships: []
      }

      // ── claim_tags ───────────────────────────────────────
      claim_tags: {
        Row: {
          id:         string
          result_id:  string
          tagged_by:  string
          message:    string | null
          created_at: string
        }
        Insert: {
          id?:       string
          result_id: string
          tagged_by: string
          message?:  string | null
        }
        Update: Partial<Database['public']['Tables']['claim_tags']['Insert']>
        Relationships: []
      }

      // ── teams ────────────────────────────────────────────
      teams: {
        Row: {
          id:              string
          result_id:       string
          team_name:       string | null
          gender_category: GenderCategory
          t1_seconds:      number | null
          t2_seconds:      number | null
          created_at:      string
        }
        Insert: {
          id?:              string
          result_id:        string
          team_name?:       string | null
          gender_category:  GenderCategory
          t1_seconds?:      number | null
          t2_seconds?:      number | null
        }
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
        Relationships: []
      }

      // ── team_members ─────────────────────────────────────
      team_members: {
        Row: {
          id:                    string
          team_id:               string
          athlete_id:            string | null
          athlete_name_snapshot: string
          disciplines:           string[]
          split_seconds:         number | null
          source_credibility:    SourceCredibility
          claim_status:          ClaimStatus
          certificate_url:       string | null
          sort_order:            number
          claimed_at:            string | null
          verified_at:           string | null
          created_at:            string
        }
        Insert: {
          id?:                    string
          team_id:                string
          athlete_id?:            string | null
          athlete_name_snapshot:  string
          disciplines:            string[]
          split_seconds?:         number | null
          source_credibility?:    SourceCredibility
          claim_status?:          ClaimStatus
          certificate_url?:       string | null
          sort_order?:            number
          claimed_at?:            string | null
          verified_at?:           string | null
        }
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
        Relationships: []
      }

      // ── race_editors ─────────────────────────────────────
      race_editors: {
        Row: {
          id:         string
          race_id:    string
          athlete_id: string
          role:       EditorRole
          granted_by: string | null
          created_at: string
        }
        Insert: {
          id?:         string
          race_id:     string
          athlete_id:  string
          role?:       EditorRole
          granted_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['race_editors']['Insert']>
        Relationships: []
      }

    }

    Views: {

      // ── leaderboard_entries ──────────────────────────────
      leaderboard_entries: {
        Row: {
          result_id:         string
          result_type:       ResultType
          total_seconds:     number
          swim_seconds:      number | null
          t1_seconds:        number | null
          bike_seconds:      number | null
          t2_seconds:        number | null
          run_seconds:       number | null
          source_credibility: SourceCredibility
          claim_status:      ClaimStatus
          claim_tag_count:   number
          overall_rank:      number | null
          ag_rank:           number | null
          bib_number:        string | null
          display_name:      string | null
          nationality:       string | null
          gender:            Gender | null
          birth_year:        number | null
          age_group:         string | null
          avatar_url:        string | null
          athlete_id:        string | null
          edition_id:        string
          edition_year:      number
          race_date:         string
          distance_category: DistanceCategory
          weather_data:      WeatherData | null
          race_id:           string
          race_name:         string
          race_slug:         string
          race_country:      string | null
          created_at:        string
        }
        Relationships: []
      }

      // ── relay_leaderboard_entries ────────────────────────
      relay_leaderboard_entries: {
        Row: {
          result_id:         string
          total_seconds:     number
          source_credibility: SourceCredibility
          claim_status:      ClaimStatus
          claim_tag_count:   number
          team_id:           string
          team_name:         string | null
          gender_category:   GenderCategory
          t1_seconds:        number | null
          t2_seconds:        number | null
          edition_id:        string
          edition_year:      number
          race_date:         string
          distance_category: DistanceCategory
          race_id:           string
          race_name:         string
          race_slug:         string
          created_at:        string
        }
        Relationships: []
      }

      // ── athlete_public_profiles ──────────────────────────
      athlete_public_profiles: {
        Row: {
          id:                  string
          nickname:            string
          nationality:         string | null
          gender:              Gender | null
          birth_year:          number | null
          bio:                 string | null
          avatar_url:          string | null
          created_at:          string
          public_result_count: number
        }
        Relationships: []
      }

    }

    Functions: {
      claim_result: {
        Args:    { p_result_id: string; p_certificate_url?: string }
        Returns: Json
      }
      approve_claim: {
        Args:    { p_result_id: string; p_approve: boolean }
        Returns: Json
      }
      unlink_result: {
        Args:    { p_result_id: string }
        Returns: Json
      }
      generate_claim_share_text: {
        Args:    { p_result_id: string }
        Returns: Json
      }
      get_my_role: {
        Args:    Record<string, never>
        Returns: string
      }
      is_assistant_or_above: {
        Args:    Record<string, never>
        Returns: boolean
      }
    }

    Enums: Record<string, never>   // 使用 CHECK constraints，非 PostgreSQL ENUM type
  }
}
