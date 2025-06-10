-- Budget Alert Service Schema
-- Extends existing finance database with budget management tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Budgets table - stores user budget plans
CREATE TABLE IF NOT EXISTS tblbudget (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    category_id UUID REFERENCES tblcategory(id) ON DELETE SET NULL,
    budget_name VARCHAR(100) NOT NULL,
    budget_amount NUMERIC(15, 2) NOT NULL CHECK (budget_amount > 0),
    period_type VARCHAR(20) NOT NULL DEFAULT 'monthly' 
        CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    alert_threshold_percentage INTEGER DEFAULT 80 
        CHECK (alert_threshold_percentage BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Budget alerts table - stores triggered alerts
CREATE TABLE IF NOT EXISTS tblbudgetalert (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES tblbudget(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL 
        CHECK (alert_type IN ('warning', 'exceeded', 'critical')),
    current_spent NUMERIC(15, 2) NOT NULL,
    budget_amount NUMERIC(15, 2) NOT NULL,
    percentage_used NUMERIC(5, 2) NOT NULL,
    message TEXT NOT NULL,
    is_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    email_sent BOOLEAN NOT NULL DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Budget spending summary table - cached spending data for performance
CREATE TABLE IF NOT EXISTS tblbudgetspending (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES tblbudget(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_budget_period UNIQUE(budget_id, period_start, period_end)
);

-- Reports table - stores generated report metadata
CREATE TABLE IF NOT EXISTS tblreport (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL 
        CHECK (report_type IN ('spending_summary', 'budget_analysis', 'trend_analysis', 'detailed_transactions')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('pdf', 'csv', 'json')),
    parameters JSONB, -- Store filter parameters
    file_path TEXT,
    file_size BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    download_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Budget categories mapping (for multiple categories per budget)
CREATE TABLE IF NOT EXISTS tblbudgetcategory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES tblbudget(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES tblcategory(id) ON DELETE CASCADE,
    allocated_amount NUMERIC(15, 2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_budget_category UNIQUE(budget_id, category_id)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS tblnotificationpreference (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    email_alerts BOOLEAN NOT NULL DEFAULT true,
    push_alerts BOOLEAN NOT NULL DEFAULT true,
    sms_alerts BOOLEAN NOT NULL DEFAULT false,
    alert_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate' 
        CHECK (alert_frequency IN ('immediate', 'daily', 'weekly')),
    threshold_warning INTEGER DEFAULT 80,
    threshold_critical INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_tblbudget_user_id ON tblbudget(user_id);
CREATE INDEX IF NOT EXISTS idx_tblbudget_category_id ON tblbudget(category_id);
CREATE INDEX IF NOT EXISTS idx_tblbudget_dates ON tblbudget(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tblbudget_active ON tblbudget(is_active, user_id);

CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_budget_id ON tblbudgetalert(budget_id);
CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_user_id ON tblbudgetalert(user_id);
CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_type ON tblbudgetalert(alert_type);
CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_sent ON tblbudgetalert(is_sent, email_sent);

CREATE INDEX IF NOT EXISTS idx_tblbudgetspending_budget_id ON tblbudgetspending(budget_id);
CREATE INDEX IF NOT EXISTS idx_tblbudgetspending_user_id ON tblbudgetspending(user_id);
CREATE INDEX IF NOT EXISTS idx_tblbudgetspending_period ON tblbudgetspending(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_tblreport_user_id ON tblreport(user_id);
CREATE INDEX IF NOT EXISTS idx_tblreport_status ON tblreport(status);
CREATE INDEX IF NOT EXISTS idx_tblreport_created_at ON tblreport(created_at DESC);

-- Triggers to automatically update updated_at
CREATE TRIGGER update_tblbudget_updated_at 
    BEFORE UPDATE ON tblbudget 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tblreport_updated_at 
    BEFORE UPDATE ON tblreport 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tblnotificationpreference_updated_at 
    BEFORE UPDATE ON tblnotificationpreference 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for existing users
INSERT INTO tblnotificationpreference (user_id, email_alerts, push_alerts, sms_alerts)
SELECT id, true, true, false 
FROM tbluser 
WHERE id NOT IN (SELECT user_id FROM tblnotificationpreference)
ON CONFLICT (user_id) DO NOTHING;
