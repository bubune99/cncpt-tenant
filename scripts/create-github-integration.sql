CREATE TABLE IF NOT EXISTS github_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_user_id INTEGER NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, github_user_id)
);

CREATE TABLE IF NOT EXISTS repository_connections (
    id SERIAL PRIMARY KEY,
    subdomain_id INTEGER NOT NULL REFERENCES subdomains(id) ON DELETE CASCADE,
    github_connection_id INTEGER NOT NULL REFERENCES github_connections(id) ON DELETE CASCADE,
    repository_name VARCHAR(255) NOT NULL,
    repository_full_name VARCHAR(255) NOT NULL,
    repository_url TEXT NOT NULL,
    branch VARCHAR(255) DEFAULT 'main',
    build_command VARCHAR(500),
    output_directory VARCHAR(255) DEFAULT 'dist',
    environment_variables JSONB DEFAULT '{}',
    deployment_status VARCHAR(50) DEFAULT 'pending',
    last_deployment_at TIMESTAMP WITH TIME ZONE,
    vercel_project_id VARCHAR(255),
    vercel_deployment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subdomain_id)
);

CREATE INDEX IF NOT EXISTS idx_github_connections_user_id ON github_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_repository_connections_subdomain_id ON repository_connections(subdomain_id);
CREATE INDEX IF NOT EXISTS idx_repository_connections_github_connection_id ON repository_connections(github_connection_id);
