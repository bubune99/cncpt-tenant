-- Make password_hash nullable for Stack Auth users who don't have passwords
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
