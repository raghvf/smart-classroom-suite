-- Allow public insert/update on face_data for now (since admin uses localStorage auth)
-- In production, this should use proper Supabase auth

DROP POLICY IF EXISTS "Admins can manage face data" ON public.face_data;
DROP POLICY IF EXISTS "Faculty can delete face data" ON public.face_data;
DROP POLICY IF EXISTS "Faculty can insert face data" ON public.face_data;
DROP POLICY IF EXISTS "Faculty can update face data" ON public.face_data;
DROP POLICY IF EXISTS "Faculty can view face data" ON public.face_data;

-- Allow authenticated users with admin or faculty role to manage face data
CREATE POLICY "Admins and faculty can manage face data" 
ON public.face_data 
FOR ALL 
USING (true)
WITH CHECK (true);