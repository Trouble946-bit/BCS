-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  requester TEXT NOT NULL,
  organization TEXT,
  email TEXT NOT NULL,
  priority TEXT,
  category TEXT,
  issue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ticket updates
CREATE TABLE IF NOT EXISTS ticket_updates (
  id SERIAL PRIMARY KEY,
  ticket_reference TEXT NOT NULL REFERENCES tickets(reference) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users (staff)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
