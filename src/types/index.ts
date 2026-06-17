// ─── Mood / Atmosphere ──────────────────────────────────────────────────────
export type MoodType =
  | 'horror'
  | 'romance'
  | 'fantasy'
  | 'thriller'
  | 'war'
  | 'adventure'
  | 'drama'
  | 'mystery'
  | 'default'

export interface AtmosphereConfig {
  mood:        MoodType
  bgColor:     string  // CSS value e.g. '#0d0d0d'
  surfaceColor:string
  accentColor: string
  textColor:   string
  mutedColor:  string
  borderColor: string
  glowColor:   string
  fontDisplay: string
  fontBody:    string
  particles:   'fog' | 'petals' | 'sparkles' | 'embers' | 'rain' | 'none'
  overlayClass:string  // Tailwind gradient overlay
}

// ─── Story ───────────────────────────────────────────────────────────────────
export type StoryStatus = 'draft' | 'published' | 'scheduled'

export interface Story {
  id:               string
  title:            string
  slug:             string
  synopsis:         string | null
  cover_image_url:  string | null
  genre:            string
  mood:             MoodType
  status:           StoryStatus
  tags:             string[]
  series_id:        string | null
  series_order:     number | null
  atmosphere_config:AtmosphereConfig
  published_at:     string | null
  scheduled_at:     string | null
  created_at:       string
  updated_at:       string
  chapters?:        Chapter[]
}

// ─── Chapter ─────────────────────────────────────────────────────────────────
export interface Chapter {
  id:           string
  story_id:     string
  title:        string
  chapter_number:number
  content:      object  // TipTap JSON doc
  status:       StoryStatus
  scheduled_at: string | null
  audio_tracks: AudioTrack[]
  word_count:   number
  created_at:   string
  updated_at:   string
}

// ─── Audio ───────────────────────────────────────────────────────────────────
export type AudioMoodTag = 'ambient' | 'tense' | 'calm' | 'epic' | 'sad' | 'mysterious'

export interface AudioTrack {
  id:        string
  label:     string
  url:       string
  mood_tag:  AudioMoodTag
  duration:  number  // seconds
  autoplay:  boolean
  loop:      boolean
}

// ─── Media Asset ─────────────────────────────────────────────────────────────
export type AssetType = 'image' | 'audio' | 'pdf' | 'document' | 'other'

export interface MediaAsset {
  id:         string
  story_id:   string | null
  label:      string
  file_url:   string
  file_type:  AssetType
  mime_type:  string
  size_bytes: number
  created_at: string
}

// ─── Series ──────────────────────────────────────────────────────────────────
export interface Series {
  id:          string
  title:       string
  description: string | null
  cover_url:   string | null
  created_at:  string
}

// ─── Reading Progress ────────────────────────────────────────────────────────
export interface ReadingProgress {
  user_id:         string
  chapter_id:      string
  story_id:        string
  scroll_position: number
  completed:       boolean
  last_read_at:    string
}

// ─── Bookmark ────────────────────────────────────────────────────────────────
export interface Bookmark {
  id:         string
  user_id:    string
  story_id:   string
  chapter_id: string | null
  created_at: string
}

// ─── Comment ─────────────────────────────────────────────────────────────────
export interface Comment {
  id:         string
  story_id:   string
  user_id:    string
  content:    string
  status:     'pending' | 'approved' | 'rejected'
  created_at: string
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface AdminSession {
  isAdmin: boolean
  email:   string
}

// ─── Chatbot ─────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}
