-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    fcm_token TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responders table
CREATE TABLE responders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    badge_number VARCHAR(50) UNIQUE,
    responder_level INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT true,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    status VARCHAR(50) DEFAULT 'pending',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    reported_by_id UUID REFERENCES users(id),
    assigned_to_id UUID REFERENCES responders(id),
    current_workflow_level INTEGER DEFAULT 1,
    escalation_history JSONB DEFAULT '[]',
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation rules table
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_type VARCHAR(50),
    severity_level INTEGER,
    current_level INTEGER,
    target_role VARCHAR(50),
    timeout_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert departments
INSERT INTO departments (id, name, code, color) VALUES
    (uuid_generate_v4(), 'Security', 'SEC', '#EF4444'),
    (uuid_generate_v4(), 'Medical', 'MED', '#10B981'),
    (uuid_generate_v4(), 'Fire', 'FIR', '#F59E0B'),
    (uuid_generate_v4(), 'Maintenance', 'MAINT', '#3B82F6');

-- Insert escalation rules
INSERT INTO escalation_rules (incident_type, severity_level, current_level, target_role, timeout_minutes) VALUES
    ('general', 3, 1, 'supervisor', 30),
    ('general', 3, 2, 'hod', 60),
    ('general', 3, 3, 'dept_director', 120),
    ('general', 3, 4, 'overall_manager', 180),
    ('general', 3, 5, 'overall_director', 240);

-- Create indexes
CREATE INDEX idx_incidents_status ON incidents(status, created_at);
CREATE INDEX idx_incidents_department ON incidents(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_responders_available ON responders(is_available);

-- Insert admin user (password: Admin123! - this is a placeholder hash, will be updated)
INSERT INTO users (id, phone, email, full_name, password, role) VALUES 
    (uuid_generate_v4(), '+2348012345678', 'admin@smartcityalert.com', 'System Administrator', '$2b$10$YourHashWillBeReplaced', 'admin');

SELECT 'Database setup complete!' as message;
