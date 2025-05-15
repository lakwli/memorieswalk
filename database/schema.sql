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

-- Memories Table
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    memory_data JSONB,
    thumbnail_url VARCHAR(255),
    view_type VARCHAR(50) DEFAULT 'canvas',  -- 'canvas', 'grid', 'places', 'timeline'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos Table
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
    file_path VARCHAR(255) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    captured_place VARCHAR(255),
    captured_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Share Links Table
CREATE TABLE share_links (
    id SERIAL PRIMARY KEY,
    memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    allow_downloads BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
