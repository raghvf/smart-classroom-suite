-- Add CGPA column to students table
ALTER TABLE public.students 
ADD COLUMN cgpa numeric(3,2) DEFAULT 0.00;