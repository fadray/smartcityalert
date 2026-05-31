-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== DEPARTMENTS TABLE ====================
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

-- ==================== USERS TABLE ====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'responder', 'supervisor', 'hod', 'dept_director', 
        'overall_manager', 'overall_director', 'admin'
    )),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    fcm_token TEXT,
    profile_picture TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== RESPONDERS/STAFF TABLE ====================
CREATE TABLE responders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),
    badge_number VARCHAR(50) UNIQUE,
    current_location GEOGRAPHY(POINT, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_available BOOLEAN DEFAULT true,
    current_incident_id UUID,
    skills TEXT[],
    certifications JSONB DEFAULT '[]',
    hire_date DATE,
    last_location_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INCIDENTS TABLE ====================
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    incident_type VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    severity_level INTEGER DEFAULT 1 CHECK (severity_level BETWEEN 1 AND 5),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'acknowledged', 'assigned', 'in_progress', 
        'escalated', 'resolved', 'closed', 'rejected'
    )),
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    
    -- Reporting info
    reported_by UUID REFERENCES users(id),
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    reporter_email VARCHAR(255),
    media_urls TEXT[],
    voice_notes TEXT[],
    
    -- Assignment
    assigned_to UUID REFERENCES responders(id),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    assigned_department_id UUID REFERENCES departments(id),
    
    -- Escalation tracking
    current_workflow_level INTEGER DEFAULT 1,
    current_workflow_node_id UUID,
    escalation_history JSONB DEFAULT '[]',
    last_escalated_at TIMESTAMPTZ,
    
    -- Response tracking
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    started_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    closure_code VARCHAR(50),
    
    -- SLA tracking
    sla_deadline TIMESTAMPTZ,
    is_sla_met BOOLEAN,
    
    -- Metadata
    priority_score INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== WORKFLOW DEFINITIONS ====================
CREATE TABLE workflow_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    incident_type VARCHAR(50) NOT NULL,
    severity_level INTEGER,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== WORKFLOW NODES ====================
CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    node_name VARCHAR(100) NOT NULL,
    node_level INTEGER NOT NULL,
    node_type VARCHAR(50) CHECK (node_type IN ('start', 'assignment', 'review', 'approval', 'escalation', 'end')),
    required_role VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    timeout_hours INTEGER DEFAULT 24,
    escalation_node_id UUID,
    notification_template TEXT,
    conditions JSONB,
    position_x INTEGER,
    position_y INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== WORKFLOW TRANSITIONS ====================
CREATE TABLE workflow_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES workflow_nodes(id),
    to_node_id UUID REFERENCES workflow_nodes(id),
    transition_name VARCHAR(100),
    condition_expression TEXT,
    action_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== INCIDENT WORKFLOW INSTANCES ====================
CREATE TABLE incident_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflow_definitions(id),
    current_node_id UUID REFERENCES workflow_nodes(id),
    workflow_state JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== ESCALATION RULES ====================
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    incident_type VARCHAR(50),
    department_id UUID REFERENCES departments(id),
    severity_level INTEGER,
    current_level INTEGER,
    target_role VARCHAR(50),
    target_department_id UUID REFERENCES departments(id),
    timeout_minutes INTEGER DEFAULT 30,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    notification_template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== REPORTS TABLE ====================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    department_id UUID REFERENCES departments(id),
    generated_by UUID REFERENCES users(id),
    parameters JSONB,
    data JSONB,
    file_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== PERFORMANCE METRICS ====================
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id),
    responder_id UUID REFERENCES responders(id),
    date DATE NOT NULL,
    incidents_assigned INTEGER DEFAULT 0,
    incidents_resolved INTEGER DEFAULT 0,
    avg_response_time_seconds INTEGER,
    avg_resolution_time_seconds INTEGER,
    escalation_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    sla_met_count INTEGER DEFAULT 0,
    sla_missed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, responder_id, date)
);

-- ==================== AUDIT LOGS ====================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== CREATE INDEXES ====================
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_responders_department ON responders(department_id);
CREATE INDEX idx_responders_available ON responders(is_available);
CREATE INDEX idx_responders_location ON responders USING GIST(current_location);
CREATE INDEX idx_incidents_department ON incidents(department_id);
CREATE INDEX idx_incidents_status ON incidents(status, created_at);
CREATE INDEX idx_incidents_assigned ON incidents(assigned_to);
CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_created ON incidents(created_at);
CREATE INDEX idx_workflow_incident ON incident_workflows(incident_id);
CREATE INDEX idx_performance_date ON performance_metrics(date);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);

-- ==================== INSERT DEPARTMENTS ====================
INSERT INTO departments (id, name, code, color) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Security', 'SEC', '#EF4444'),
    ('22222222-2222-2222-2222-222222222222', 'Medical', 'MED', '#10B981'),
    ('33333333-3333-3333-3333-333333333333', 'Fire', 'FIR', '#F59E0B'),
    ('44444444-4444-4444-4444-444444444444', 'Maintenance', 'MAINT', '#3B82F6');

-- ==================== INSERT DEFAULT ADMIN ====================
-- Password: Admin123!
INSERT INTO users (id, phone, email, full_name, password, role, is_active) VALUES 
    ('99999999-9999-9999-9999-999999999999', '+2348012345678', 'admin@smartcityalert.com', 'System Administrator', 
     '$2b$10$YourHashedPasswordHere', 'admin', true);

-- ==================== INSERT DEFAULT WORKFLOW ====================
INSERT INTO workflow_definitions (id, name, description, incident_type, is_active) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Standard Incident Workflow', 'Default workflow for all incidents', 'general', true);

-- Insert workflow nodes
INSERT INTO workflow_nodes (id, workflow_id, node_name, node_level, node_type, required_role, timeout_hours) VALUES
    ('n1','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Reported', 1, 'start', 'responder', 0),
    ('n2','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Assigned to Staff', 2, 'assignment', 'responder', 1),
    ('n3','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Staff Review', 3, 'review', 'responder', 2),
    ('n4','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Supervisor Review', 4, 'approval', 'supervisor', 2),
    ('n5','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HOD Review', 5, 'approval', 'hod', 4),
    ('n6','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Department Director', 6, 'approval', 'dept_director', 6),
    ('n7','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Overall Manager', 7, 'approval', 'overall_manager', 12),
    ('n8','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Overall Director', 8, 'approval', 'overall_director', 24),
    ('n9','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Resolved', 9, 'end', NULL, 0);

-- Insert default escalation rules
INSERT INTO escalation_rules (name, incident_type, current_level, target_role, timeout_minutes, priority) VALUES
    ('Staff to Supervisor', 'general', 2, 'supervisor', 30, 1),
    ('Supervisor to HOD', 'general', 3, 'hod', 60, 2),
    ('HOD to Dept Director', 'general', 4, 'dept_director', 120, 3),
    ('Dept Director to Overall Manager', 'general', 5, 'overall_manager', 180, 4),
    ('Overall Manager to Overall Director', 'general', 6, 'overall_director', 240, 5);