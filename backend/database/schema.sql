-- Aegis Forensics Database Schema
-- SQLite Schema for Digital Forensics Platform
-- Generated automatically by SQLAlchemy models

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    organization VARCHAR NOT NULL,
    timezone VARCHAR DEFAULT 'UTC' NOT NULL,
    password_hash VARCHAR NOT NULL,
    avatar_base64 TEXT,
    is_admin BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    password_expires_at DATETIME,
    is_active BOOLEAN DEFAULT 1
);

CREATE INDEX ix_users_id ON users (id);
CREATE INDEX ix_users_email ON users (email);

-- Cases table
CREATE TABLE cases (
    id INTEGER PRIMARY KEY,
    case_number VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    investigator VARCHAR NOT NULL,
    status VARCHAR CHECK (status IN ('OPEN', 'ANALYZING', 'CLOSED', 'SUSPENDED')) DEFAULT 'OPEN' NOT NULL,
    priority VARCHAR CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM' NOT NULL,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_cases_id ON cases (id);
CREATE INDEX ix_cases_case_number ON cases (case_number);

-- Evidence table
CREATE TABLE evidence (
    id INTEGER PRIMARY KEY,
    case_id INTEGER REFERENCES cases (id),
    filename VARCHAR,
    file_path VARCHAR,
    file_hash VARCHAR,
    file_size INTEGER,
    file_type VARCHAR,
    collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    prev_hash VARCHAR DEFAULT '',
    current_hash VARCHAR,
    evidence_metadata TEXT
);

CREATE INDEX ix_evidence_id ON evidence (id);
CREATE INDEX ix_evidence_current_hash ON evidence (current_hash);

-- Events table
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    case_id INTEGER REFERENCES cases (id),
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    prev_hash VARCHAR DEFAULT '',
    current_hash VARCHAR,
    extra TEXT
);

CREATE INDEX ix_events_id ON events (id);
CREATE INDEX ix_events_current_hash ON events (current_hash);

-- Agent Reports table
CREATE TABLE agent_reports (
    id INTEGER PRIMARY KEY,
    case_id INTEGER REFERENCES cases (id),
    agent_name VARCHAR NOT NULL,
    evidence_id INTEGER REFERENCES evidence (id),
    analysis_type VARCHAR NOT NULL,
    verdict VARCHAR,
    severity VARCHAR,
    confidence VARCHAR,
    summary TEXT,
    findings TEXT,
    technical_details TEXT,
    recommendations TEXT,
    raw_output TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_agent_reports_id ON agent_reports (id);


INSERT INTO cases (case_number, name, description, investigator, status, priority, tags) VALUES 
('CASE-2024-001', 'Suspicious Email Investigation', 'Investigation of phishing email with malicious attachments', 'Admin User', 'OPEN', 'HIGH', '["phishing", "email", "malware"]'),
('CASE-2024-002', 'Network Intrusion Analysis', 'Analysis of potential network breach and data exfiltration', 'Admin User', 'ANALYZING', 'CRITICAL', '["network", "intrusion", "breach"]'),
('CASE-2024-003', 'Mobile Device Forensics', 'Forensic analysis of confiscated mobile device', 'Admin User', 'OPEN', 'MEDIUM', '["mobile", "device", "forensics"]');
