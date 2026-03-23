export interface User {
  id: number;
  email: string;
  phone?: string;
  firebase_uid?: string;
  is_subscribed: boolean;
  religious_mode: boolean;
  has_diabetes: boolean;
  is_admin?: boolean;
  share_progress?: boolean;
  theme?: 'dark' | 'light';
  accent_color?: string;
  notifications_enabled?: boolean;
  profile?: Profile;
}

export interface Profile {
  name: string;
  height: number;
  starting_weight: number;
  goal_weight: number;
  why_statement: string;
  starting_photo_url: string;
  dietary_restrictions?: string; // Comma separated or JSON string
}

export interface Challenge {
  id: number;
  user_id: number;
  start_date: string;
  is_active: boolean;
  water_goal_glasses: number;
  steps_goal: number;
  workouts_count: number;
  cardio_minutes: number;
  reading_goal_pages: number;
  prayer_devotion: boolean;
  fasting_hours: number;
  quit_nicotine: boolean;
  quit_alcohol: boolean;
  quit_porn: boolean;
  meds_vitamins: MedConfig[];
  macro_calories: number;
  macro_protein: number;
  macro_carbs: number;
  macro_fat: number;
}

export interface MedConfig {
  name: string;
  time: string;
  quantity: string;
  type: 'medicine' | 'vitamin' | 'supplement';
}

export interface DailyLog {
  id?: number;
  user_id: number;
  challenge_id: number;
  log_date: string;
  water_intake_glasses: number;
  steps_count: number;
  workouts_done: number;
  cardio_done: number;
  reading_done: number;
  reading_type?: 'regular' | 'bible';
  bible_study_done: number;
  prayer_done: number;
  fasting_done: number;
  nicotine_free: number;
  alcohol_free: number;
  porn_free: number;
  meds_taken: { name: string; taken: boolean }[];
  notes: string;
  is_finalized?: boolean;
}

export interface SocialGroup {
  id: number;
  name: string;
  description: string;
  category: 'run-club' | 'bible-study' | 'accountability' | 'general';
  created_by: number;
  created_at: string;
}

export interface SocialMessage {
  id: number;
  group_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name?: string;
}

export interface SocialPlaylist {
  id: number;
  user_id: number;
  name: string;
  url: string;
  category: 'running' | 'gym' | 'house' | 'bible-study' | 'other';
  created_at: string;
  user_name?: string;
}

export interface SocialConnection {
  id: number;
  user_id: number;
  connected_user_id: number;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface FoodLog {
  id?: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface StatHistory {
  id: number;
  log_date: string;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  ecw?: number;
  tbw?: number;
  photo_url: string;
}

export interface SavedRecipe {
  id: number;
  user_id: number;
  name: string;
  ingredients: string; // JSON string
  instructions: string;
  macros: string; // JSON string
  created_at: string;
}
