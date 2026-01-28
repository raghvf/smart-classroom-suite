-- Fix 1: Drop the overly permissive face_data policy and create proper ones
DROP POLICY IF EXISTS "Admins and faculty can manage face data" ON public.face_data;

-- Admins can manage all face data
CREATE POLICY "Admins can manage all face data"
ON public.face_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Faculty can only view face data (for attendance purposes)
CREATE POLICY "Faculty can view face data"
ON public.face_data
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Faculty can insert face data they create
CREATE POLICY "Faculty can insert face data"
ON public.face_data
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

-- Students can view their own face data
CREATE POLICY "Students can view their own face data"
ON public.face_data
FOR SELECT
USING (
  user_type = 'student' AND student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Fix 2: Create a public view for students table that excludes sensitive PII
-- Faculty should only see non-sensitive student info
CREATE OR REPLACE VIEW public.students_public
WITH (security_invoker = on) AS
SELECT 
  id,
  student_id,
  user_id,
  semester,
  enrollment_date,
  created_at,
  updated_at,
  department,
  batch,
  status
  -- Excludes: phone, address (sensitive PII)
FROM public.students;

-- Drop the existing faculty view policy on students
DROP POLICY IF EXISTS "Faculty can view all students" ON public.students;

-- Create a more restrictive policy - faculty uses the view instead
CREATE POLICY "Faculty can view students via public view"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'faculty'::app_role) AND 
  -- This policy intentionally blocks direct table access for faculty
  -- They should use the students_public view instead
  false
);

-- Grant select on the public view to authenticated users
GRANT SELECT ON public.students_public TO authenticated;