-- Add UTM tracking columns to feedback_responses table
ALTER TABLE feedback_responses 
ADD COLUMN utm_source VARCHAR(255),
ADD COLUMN utm_medium VARCHAR(255),
ADD COLUMN utm_campaign VARCHAR(255),
ADD COLUMN utm_term VARCHAR(255),
ADD COLUMN utm_content VARCHAR(255),
ADD COLUMN referrer TEXT,
ADD COLUMN landing_page TEXT;

-- Add index for better query performance on UTM fields
CREATE INDEX idx_feedback_utm_source ON feedback_responses(utm_source);
CREATE INDEX idx_feedback_utm_campaign ON feedback_responses(utm_campaign);
