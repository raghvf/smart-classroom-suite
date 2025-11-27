-- Create table for storing face descriptors
CREATE TABLE public.face_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  descriptors JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Enable RLS
ALTER TABLE public.face_data ENABLE ROW LEVEL SECURITY;

-- Faculty can manage face data
CREATE POLICY "Faculty can view face data"
ON public.face_data
FOR SELECT
USING (has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Faculty can insert face data"
ON public.face_data
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Faculty can update face data"
ON public.face_data
FOR UPDATE
USING (has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Faculty can delete face data"
ON public.face_data
FOR DELETE
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Admins can do everything
CREATE POLICY "Admins can manage face data"
ON public.face_data
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_face_data_updated_at
BEFORE UPDATE ON public.face_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_face_data_student ON public.face_data(student_id);