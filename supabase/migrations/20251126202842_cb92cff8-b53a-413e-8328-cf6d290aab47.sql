-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Students can view their own attendance
CREATE POLICY "Students can view their own attendance"
ON public.attendance
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Faculty can view all attendance
CREATE POLICY "Faculty can view all attendance"
ON public.attendance
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Faculty can insert attendance
CREATE POLICY "Faculty can insert attendance"
ON public.attendance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

-- Faculty can update attendance
CREATE POLICY "Faculty can update attendance"
ON public.attendance
FOR UPDATE
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Admins can do everything
CREATE POLICY "Admins can manage all attendance"
ON public.attendance
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date DESC);
CREATE INDEX idx_attendance_date ON public.attendance(date DESC);