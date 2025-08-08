-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    user_id TEXT NOT NULL,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS events_user_id_idx ON events(user_id);

-- Create index on type for faster queries
CREATE INDEX IF NOT EXISTS events_type_idx ON events(type);

-- Create index on created_at for faster time-based queries
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events(created_at); 