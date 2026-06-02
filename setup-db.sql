-- Create extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    severity_level INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'pending',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    reported_by UUID REFERENCES users(id),
    current_workflow_level INTEGER DEFAULT 1,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert departments
INSERT INTO departments (id, name, code, description, color) VALUES
    (gen_random_uuid(), 'Security', 'SEC', 'Security and safety operations', '#EF4444'),
    (gen_random_uuid(), 'Medical', 'MED', 'Medical emergency response', '#10B981'),
    (gen_random_uuid(), 'Fire', 'FIR', 'Fire and rescue services', '#F59E0B'),
    (gen_random_uuid(), 'Maintenance', 'MAINT', 'Infrastructure and facilities', '#3B82F6')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: Admin123! hashed with bcrypt)
INSERT INTO users (phone, email, full_name, password, role) VALUES 
    ('+2348012345678', 'admin@smartcityalert.com', 'System Administrator', 
     '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrYPZ2fN5jK5Cq9qW5oQ5L5L5L5L5L', 'admin')
ON CONFLICT (phone) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status, created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_department ON incidents(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Show setup completion
SELECT 'Database setup complete!' as message;
SELECT COUNT(*) as departments_count FROM departments;
SELECT COUNT(*) as users_count FROM users;
