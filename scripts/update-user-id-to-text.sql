-- Update database schema to use TEXT for user_id to support Stack Auth UUIDs
-- This script converts integer user_id fields to text to support Stack Auth UUID format

-- First, drop foreign key constraints that reference users(id)
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE subdomains DROP CONSTRAINT IF EXISTS subdomains_user_id_fkey;

-- Update users table to use TEXT for id instead of SERIAL
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users ALTER COLUMN id TYPE TEXT;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Update sessions table user_id to TEXT
ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT;

-- Update subdomains table user_id to TEXT  
ALTER TABLE subdomains ALTER COLUMN user_id TYPE TEXT;

-- Re-add foreign key constraints
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subdomains ADD CONSTRAINT subdomains_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update any existing integer user IDs (this will likely be empty for new installations)
-- Note: This is safe to run even if there's no existing data
