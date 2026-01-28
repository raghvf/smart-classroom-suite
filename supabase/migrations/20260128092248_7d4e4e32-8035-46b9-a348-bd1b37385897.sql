-- Fix the faculty policy - they need to view students for attendance
-- Drop the blocking policy
DROP POLICY IF EXISTS "Faculty can view students via public view" ON public.students;

-- Create a proper policy that allows faculty to see non-sensitive student data
-- Faculty CAN access the table but the view is the recommended approach
CREATE POLICY "Faculty can view students"
ON public.students
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Make sure admins and faculty can see profiles for name lookup
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Faculty can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Faculty can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));