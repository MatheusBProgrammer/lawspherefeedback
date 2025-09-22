-- Create feedback responses table for Lawyer Connect feedback form
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  overall_usefulness INTEGER NOT NULL CHECK (overall_usefulness >= 1 AND overall_usefulness <= 10),
  client_communication_impact TEXT NOT NULL CHECK (client_communication_impact IN ('yes_noticeably', 'somewhat', 'no_change', 'too_early_to_tell')),
  reliability INTEGER NOT NULL CHECK (reliability >= 1 AND reliability <= 10),
  value_perception TEXT NOT NULL CHECK (value_perception IN ('yes', 'no', 'maybe')),
  next_tools TEXT[] NOT NULL, -- Array of selected tools
  firm_profile TEXT NOT NULL CHECK (firm_profile IN ('solo', '2_10_lawyers', '11_50_lawyers', '50_plus_lawyers')),
  early_access_invitation TEXT NOT NULL CHECK (early_access_invitation IN ('yes', 'no')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required for feedback form)
CREATE POLICY "Allow public to insert feedback" ON public.feedback_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public to view feedback" ON public.feedback_responses
  FOR SELECT USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_responses_created_at ON public.feedback_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_email ON public.feedback_responses(email);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_responses_updated_at 
    BEFORE UPDATE ON public.feedback_responses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
