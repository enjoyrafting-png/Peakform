import { z } from 'zod'

// Login form validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

// Signup form validation
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['athlete', 'coach', 'admin'])
})

// Profile form validation
export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  age: z.string().min(1, 'Age is required'),
  playingRole: z.string().min(1, 'Playing role is required'),
  battingStyle: z.string().optional(),
  bowlingStyle: z.string().optional(),
  photo: z.string().optional(),
  team: z.string().optional(),
  experience: z.string().min(1, 'Experience is required'),
  goals: z.string().optional()
})

// Training log validation
export const trainingLogSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  session_type: z.string().min(1, 'Session type is required'),
  intensity: z.enum(['low', 'moderate', 'high', 'maximum']),
  duration: z.number().min(0, 'Duration must be a positive number'),
  performance_notes: z.string().optional(),
  coach_notes: z.string().optional()
})

// Fitness data validation
export const fitnessDataSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  weight: z.number().min(0, 'Weight must be a positive number'),
  bmi: z.number().min(0, 'BMI must be a positive number'),
  body_fat: z.number().min(0, 'Body fat must be a positive number'),
  muscle_mass: z.number().min(0, 'Muscle mass must be a positive number'),
  bmr: z.number().min(0, 'BMR must be a positive number'),
  water: z.number().min(0, 'Water must be a positive number'),
  body_fat_mass: z.number().min(0, 'Body fat mass must be a positive number'),
  lean_body_mass: z.number().min(0, 'Lean body mass must be a positive number'),
  bone_mass: z.number().min(0, 'Bone mass must be a positive number'),
  visceral_fat: z.number().min(0, 'Visceral fat must be a positive number'),
  protein: z.number().min(0, 'Protein must be a positive number'),
  skeletal_muscle_mass: z.number().min(0, 'Skeletal muscle mass must be a positive number'),
  subcutaneous_fat: z.number().min(0, 'Subcutaneous fat must be a positive number'),
  body_age: z.number().min(0, 'Body age must be a positive number'),
  body_type: z.string().min(1, 'Body type is required')
})

// Match stats validation
export const matchStatsSchema = z.object({
  match_date: z.string().min(1, 'Match date is required'),
  opponent: z.string().min(1, 'Opponent is required'),
  venue: z.string().min(1, 'Venue is required'),
  runs_scored: z.number().min(0, 'Runs scored must be a positive number'),
  wickets_taken: z.number().min(0, 'Wickets taken must be a positive number'),
  overs_bowled: z.number().min(0, 'Overs bowled must be a positive number'),
  catches: z.number().min(0, 'Catches must be a positive number'),
  run_out: z.boolean().optional(),
  man_of_match: z.boolean().optional(),
  bowling_figures: z.string().optional(),
  batting_figures: z.string().optional(),
  match_result: z.enum(['won', 'lost', 'draw', 'tied']),
  notes: z.string().optional()
})

// Settings profile update validation
export const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal(''))
})

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type TrainingLogFormData = z.infer<typeof trainingLogSchema>
export type FitnessDataFormData = z.infer<typeof fitnessDataSchema>
export type MatchStatsFormData = z.infer<typeof matchStatsSchema>
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
