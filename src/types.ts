export interface User {
  id: number;
  email: string;
  is_subscribed: boolean;
  religious_mode: boolean;
  has_diabetes: boolean;
  is_admin?: boolean;
  share_progress?: boolean;
  profile?: Profile;
}

export interface Profile {
  name: string;
  height: number;
  starting_weight: number;
  goal_weight: number;
  why_statement: string;
  starting_photo_url: string;
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
