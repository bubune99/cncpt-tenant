-- Fix user_id type mismatch for Stack Auth compatibility
-- Convert INTEGER user_id columns to TEXT to support UUIDs

-- Drop existing foreign key constraints
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE subdomains DROP CONSTRAINT IF EXISTS subdomains_user_id_fkey;

-- Drop existing primary key on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Change users.id from integer to text
ALTER TABLE users ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Change sessions.user_id from integer to text  
ALTER TABLE sessions ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Change subdomains.user_id from integer to text
ALTER TABLE subdomains ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Re-add primary key constraint on users
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- Re-add foreign key constraints
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subdomains ADD CONSTRAINT subdomains_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Clear existing data since it won't be compatible with Stack Auth UUIDs
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE subdomains CASCADE;  
TRUNCATE TABLE users CASCADE;
