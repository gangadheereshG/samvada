-- SAMVADA Database Schema (PostgreSQL)
-- Anonymous session persistence for Safety, Reports, Blocks and Match History

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_session_id VARCHAR(64) NOT NULL,
    reported_session_id VARCHAR(64) NOT NULL,
    reason VARCHAR(64) NOT NULL,
    details TEXT,
    match_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_reported_session ON reports(reported_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- User Blocks Table (Prevents future matches between sessions)
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_session_id VARCHAR(64) NOT NULL,
    blocked_session_id VARCHAR(64) NOT NULL,
    match_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_block_pair UNIQUE (blocker_session_id, blocked_session_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_session_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_session_id);

-- Match History Table (Minimal metadata for safety audits, no private chat logs)
CREATE TABLE IF NOT EXISTS match_history (
    id VARCHAR(64) PRIMARY KEY,
    user_a_session_id VARCHAR(64) NOT NULL,
    user_b_session_id VARCHAR(64) NOT NULL,
    shared_interests TEXT[] DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason VARCHAR(64) -- 'skip', 'disconnect', 'report', 'block'
);

CREATE INDEX IF NOT EXISTS idx_match_history_users ON match_history(user_a_session_id, user_b_session_id);
CREATE INDEX IF NOT EXISTS idx_match_history_started ON match_history(started_at);

-- Safety & Abuse Monitoring Logs
CREATE TABLE IF NOT EXISTS safety_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_safety_logs_session ON safety_logs(session_id);
