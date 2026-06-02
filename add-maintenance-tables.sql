-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    department_id UUID REFERENCES departments(id),
    reported_by_id UUID REFERENCES users(id),
    assigned_to_id UUID REFERENCES users(id),
    images TEXT[],
    scheduled_date DATE,
    completion_date DATE,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    technician_notes TEXT,
    verification_notes TEXT,
    parts_used TEXT[],
    requires_verification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    purchase_date DATE,
    warranty_expiry DATE,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    maintenance_history JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_department ON maintenance_requests(department_id);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_assets_next_maintenance ON assets(next_maintenance_date);

-- Insert sample assets
INSERT INTO assets (name, asset_tag, location, manufacturer, model, purchase_date, next_maintenance_date) VALUES
    ('Generator Set', 'GEN-001', 'Main Power House', 'Cummins', 'C250D5', '2023-01-15', '2024-06-15'),
    ('Water Pump', 'PMP-001', 'Water Treatment Plant', 'Grundfos', 'CR120', '2023-03-20', '2024-07-20'),
    ('Security Camera System', 'CAM-001', 'Main Gate', 'Hikvision', 'DS-2CD2', '2023-06-10', '2024-09-10'),
    ('Fire Alarm Panel', 'FAP-001', 'Building A', 'Honeywell', 'Notifier', '2022-11-05', '2024-05-05');

SELECT 'Maintenance tables created successfully!' as status;
