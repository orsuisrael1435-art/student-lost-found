-- ============================================================
-- STUDENT LOST & FOUND PORTAL - Database Schema (PostgreSQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS handovers CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15),
    department VARCHAR(100),
    year INTEGER CHECK (year BETWEEN 1 AND 6),
    section VARCHAR(10),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'superadmin')),
    profile_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- BUILDINGS TABLE
-- ============================================================
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    building_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROOMS TABLE
-- ============================================================
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    floor INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(building_id, room_number)
);

-- ============================================================
-- LOST ITEMS TABLE
-- ============================================================
CREATE TABLE lost_items (
    id SERIAL PRIMARY KEY,
    lost_id VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    category VARCHAR(100),
    colour VARCHAR(50),
    brand VARCHAR(100),
    description TEXT,
    lost_date DATE NOT NULL,
    lost_time TIME,
    building VARCHAR(100),
    room_number VARCHAR(20),
    specific_location TEXT,
    image_url VARCHAR(500),
    additional_info TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'possible_match', 'matched', 'returned', 'closed')),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- FOUND ITEMS TABLE
-- ============================================================
CREATE TABLE found_items (
    id SERIAL PRIMARY KEY,
    found_id VARCHAR(20) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    category VARCHAR(100),
    colour VARCHAR(50),
    brand VARCHAR(100),
    description TEXT,
    found_date DATE NOT NULL,
    found_time TIME,
    building VARCHAR(100),
    room_number VARCHAR(20),
    specific_location TEXT,
    image_url VARCHAR(500),
    additional_details TEXT,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'possible_match', 'owner_contacted', 'returned', 'closed')),
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- MATCHES TABLE
-- ============================================================
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    lost_item_id INTEGER REFERENCES lost_items(id) ON DELETE CASCADE,
    found_item_id INTEGER REFERENCES found_items(id) ON DELETE CASCADE,
    match_score DECIMAL(5,2) NOT NULL,
    match_breakdown JSONB, -- Stores breakdown of each scoring factor
    match_reason TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'contact_requested', 'contact_accepted', 'contact_rejected', 'verifying', 'handover_scheduled', 'returned', 'closed', 'false_match')),
    contact_requested_by INTEGER REFERENCES users(id),
    contact_requested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(lost_item_id, found_item_id)
);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'match', 'contact', 'handover', 'returned', 'admin', 'warning')),
    related_id INTEGER, -- Could be match_id, lost_id, found_id, etc.
    related_type VARCHAR(30), -- 'match', 'lost', 'found', 'handover'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- HANDOVERS TABLE
-- ============================================================
CREATE TABLE handovers (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
    finder_id INTEGER REFERENCES users(id),
    owner_id INTEGER REFERENCES users(id),
    location VARCHAR(200) NOT NULL,
    handover_date DATE NOT NULL,
    handover_time TIME NOT NULL,
    finder_confirmed BOOLEAN DEFAULT FALSE,
    owner_confirmed BOOLEAN DEFAULT FALSE,
    finder_confirmed_at TIMESTAMP WITH TIME ZONE,
    owner_confirmed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================
CREATE INDEX idx_lost_items_user_id ON lost_items(user_id);
CREATE INDEX idx_lost_items_status ON lost_items(status);
CREATE INDEX idx_lost_items_category ON lost_items(category);
CREATE INDEX idx_lost_items_lost_date ON lost_items(lost_date);
CREATE INDEX idx_found_items_user_id ON found_items(user_id);
CREATE INDEX idx_found_items_status ON found_items(status);
CREATE INDEX idx_found_items_category ON found_items(category);
CREATE INDEX idx_found_items_found_date ON found_items(found_date);
CREATE INDEX idx_matches_lost_item_id ON matches(lost_item_id);
CREATE INDEX idx_matches_found_item_id ON matches(found_item_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_match_id ON messages(match_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- ============================================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_lost_items_updated_at BEFORE UPDATE ON lost_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_found_items_updated_at BEFORE UPDATE ON found_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_handovers_updated_at BEFORE UPDATE ON handovers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
