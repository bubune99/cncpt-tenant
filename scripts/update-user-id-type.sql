-- Update user_id columns to work with Stack Auth string IDs
ALTER TABLE subdomains ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE sessions DROP TABLE IF EXISTS sessions; -- Stack Auth handles sessions
