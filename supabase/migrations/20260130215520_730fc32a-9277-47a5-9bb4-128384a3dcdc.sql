-- Recreate the view as invoker-secured (ensures underlying RLS is enforced)
CREATE OR REPLACE VIEW public.students_public
WITH (security_invoker=on)
AS
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
  FROM public.students;

-- Lock down view privileges so it cannot be read anonymously
REVOKE ALL ON TABLE public.students_public FROM PUBLIC;
REVOKE ALL ON TABLE public.students_public FROM anon;

-- Allow only signed-in users to read it (RLS on the base table still applies)
GRANT SELECT ON TABLE public.students_public TO authenticated;