export interface Profile {
  id: string
  full_name: string | null
  role: 'athlete' | 'coach' | 'admin'
  coach_id?: string
  username?: string | null
  avatar_url?: string | null
  website?: string | null
  created_at?: string
  updated_at?: string
  playing_role?: string
  batting_style?: string
  bowling_style?: string
  photo?: string
  age?: number
  team?: string
  experience?: number
  goals?: string
}

export interface Athlete {
  id: string
  full_name: string
  role: string
  coach_id?: string
}
