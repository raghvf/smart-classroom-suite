-- Drop the existing unique constraint first
ALTER TABLE public.face_data DROP CONSTRAINT IF EXISTS face_data_student_id_key;

-- Add user_type column to face_data to support both students and faculty
ALTER TABLE public.face_data ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'student';

-- Add user_id column for faculty (who don't have a student record)
ALTER TABLE public.face_data ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Make student_id nullable since faculty won't have one
ALTER TABLE public.face_data ALTER COLUMN student_id DROP NOT NULL;

-- Add check constraint to ensure either student_id or user_id is set
ALTER TABLE public.face_data ADD CONSTRAINT face_data_user_check 
  CHECK (student_id IS NOT NULL OR user_id IS NOT NULL);

-- Create unique indexes for each type
CREATE UNIQUE INDEX IF NOT EXISTS face_data_student_id_unique ON public.face_data(student_id) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS face_data_user_id_unique ON public.face_data(user_id) WHERE user_id IS NOT NULL;