-- Add EXTENSION for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in reverse order of dependency or use CASCADE
DROP TABLE IF EXISTS share_links CASCADE;
DROP TABLE IF EXISTS memory_view_configurations CASCADE;
DROP TABLE IF EXISTS memory_photos CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor')), -- Added CHECK constraint for roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user (password: admin)
-- Hash for 'admin': $2b$10$tC7BJbvf25cjFXkOScaSW.BFyqDjQsim3ygxTYliFW9mqMWuDsdYu
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$tC7BJbvf25cjFXkOScaSW.BFyqDjQsim3ygxTYliFW9mqMWuDsdYu', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Memories Table
CREATE TABLE memories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255), -- Could be a path to a specific photo or a generated image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Photos Table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Changed to UUID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User who uploaded/owns the photo
    file_path VARCHAR(1024) NOT NULL UNIQUE, -- Path to the stored photo, should be unique
    file_hash VARCHAR(64), -- SHA256 hash of the file to detect duplicates, can be NULL if not implemented
    mime_type VARCHAR(100), -- e.g. image/jpeg
    size_bytes BIGINT, -- File size
    width INTEGER, -- Image width
    height INTEGER, -- Image height
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    captured_place VARCHAR(255),
    captured_at TIMESTAMP WITH TIME ZONE, -- When the photo was taken
    metadata JSONB, -- For EXIF, IPTC, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- When the record was created
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- For potential updates to metadata, etc.
);

CREATE TRIGGER update_photos_updated_at
BEFORE UPDATE ON photos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Join Table for Memories and Photos (Many-to-Many)
CREATE TABLE memory_photos (
    memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE, -- Changed to UUID
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Optional: position of the photo in the memory, if a default order is desired
    -- photo_order INTEGER DEFAULT 0,
    PRIMARY KEY (memory_id, photo_id)
);

-- Memory View Configurations Table
CREATE TABLE memory_view_configurations (
    id SERIAL PRIMARY KEY,
    memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Typically the memory owner
    name VARCHAR(255) NOT NULL, -- e.g., "My Canvas Layout", "Trip Timeline"
    view_type VARCHAR(50) NOT NULL, -- e.g., 'canvas', 'grid', 'map', 'timeline'
    configuration_data JSONB NOT NULL, -- Specific settings for this view type
    is_primary_view BOOLEAN DEFAULT FALSE, -- Indicates if this is the default view for the memory
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_memory_view_configurations_updated_at
BEFORE UPDATE ON memory_view_configurations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one primary view per memory
-- Note: For this to work correctly, is_primary_view should not be nullable.
-- If is_primary_view can be NULL, the condition should be `WHERE is_primary_view IS TRUE`.
-- Given `DEFAULT FALSE`, it won't be NULL unless explicitly set.
CREATE UNIQUE INDEX idx_unique_primary_view_per_memory
ON memory_view_configurations (memory_id)
WHERE is_primary_view = TRUE;

-- Share Links Table
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions VARCHAR(50) NOT NULL DEFAULT 'view_only',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add an index to the token column for faster lookups
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);

-- Add an index to memory_id for faster lookups when dealing with a specific memory
CREATE INDEX IF NOT EXISTS idx_share_links_memory_id ON share_links(memory_id);

-- Add some indexes for common queries
CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_memory_photos_photo_id ON memory_photos(photo_id);
CREATE INDEX idx_memory_view_configurations_memory_id ON memory_view_configurations(memory_id);
CREATE INDEX idx_memory_view_configurations_user_id ON memory_view_configurations(user_id);

-- Example of adding a CHECK constraint for view_type if you have a known set
-- ALTER TABLE memory_view_configurations ADD CONSTRAINT check_view_type
-- CHECK (view_type IN ('canvas', 'grid', 'timeline', 'map', 'list'));

-- Note: Timestamps are stored WITH TIME ZONE for better handling across different timezones.
-- Application layer should handle timezone conversions if necessary for display.
