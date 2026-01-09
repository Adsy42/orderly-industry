-- Create waitlist_signups table for landing page signups
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  practice_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  source TEXT DEFAULT 'landing_page'
);

-- Create index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON waitlist_signups(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON waitlist_signups(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for public waitlist form)
CREATE POLICY "Allow anonymous inserts" ON waitlist_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to view all signups (for admin purposes)
CREATE POLICY "Authenticated users can view signups" ON waitlist_signups
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert (in case they're logged in)
CREATE POLICY "Allow authenticated inserts" ON waitlist_signups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant insert permission to both anonymous and authenticated users
GRANT INSERT ON waitlist_signups TO anon;
GRANT INSERT ON waitlist_signups TO authenticated;
