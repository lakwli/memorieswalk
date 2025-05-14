-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user (password: admin)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$tC7BJbvf25cjFXkOScaSW.BFyqDjQsim3ygxTYliFW9mqMWuDsdYu', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Canvases Table
CREATE TABLE canvases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    canvas_data JSONB,
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Share Links Table
CREATE TABLE share_links (
    id SERIAL PRIMARY KEY,
    canvas_id INTEGER REFERENCES canvases(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    allow_downloads BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
