-- Budget Alert Service Setup - Additional indexes and constraints
-- This service uses the existing budget tables from server/migrations/budget_schema.sql

-- Ensure all necessary indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_user_created ON tblbudgetalert(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tblbudgetalert_is_sent ON tblbudgetalert(is_sent);
CREATE INDEX IF NOT EXISTS idx_tblbudgetspending_last_updated ON tblbudgetspending(last_updated DESC);

-- Create a function to calculate current period spending for a budget
CREATE OR REPLACE FUNCTION get_budget_current_spending(budget_id_param UUID, user_id_param UUID)
RETURNS TABLE(
    total_spent NUMERIC(15,2),
    transaction_count INTEGER,
    period_start DATE,
    period_end DATE
) AS $$
DECLARE
    budget_record RECORD;
    calc_start_date DATE;
    calc_end_date DATE;
BEGIN
    -- Get budget details
    SELECT * INTO budget_record 
    FROM tblbudget 
    WHERE id = budget_id_param AND user_id = user_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calculate current period dates based on budget period_type
    CASE budget_record.period_type
        WHEN 'weekly' THEN
            calc_start_date := date_trunc('week', CURRENT_DATE);
            calc_end_date := calc_start_date + INTERVAL '6 days';
        WHEN 'monthly' THEN
            calc_start_date := date_trunc('month', CURRENT_DATE);
            calc_end_date := (calc_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
        WHEN 'yearly' THEN
            calc_start_date := date_trunc('year', CURRENT_DATE);
            calc_end_date := (calc_start_date + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
        ELSE -- daily
            calc_start_date := CURRENT_DATE;
            calc_end_date := CURRENT_DATE;
    END CASE;
    
    -- Ensure dates are within budget validity period
    calc_start_date := GREATEST(calc_start_date, budget_record.start_date);
    calc_end_date := LEAST(calc_end_date, budget_record.end_date);
    
    -- Calculate spending from transactions
    SELECT 
        COALESCE(SUM(t.amount), 0) as spent,
        COUNT(*) as tx_count
    INTO total_spent, transaction_count
    FROM tbltransaction t
    WHERE t.user_id = user_id_param
        AND t.category_id = budget_record.category_id
        AND t.type = 'expense'
        AND t.status = 'completed'
        AND DATE(t.created_at) BETWEEN calc_start_date AND calc_end_date;
    
    period_start := calc_start_date;
    period_end := calc_end_date;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create a view for budget status overview
CREATE OR REPLACE VIEW v_budget_status AS
SELECT 
    b.id as budget_id,
    b.user_id,
    b.budget_name,
    b.budget_amount,
    b.period_type,
    b.currency,
    b.alert_threshold_percentage,
    b.is_active,
    c.name as category_name,
    c.type as category_type,
    bs.total_spent,
    bs.transaction_count,
    bs.period_start,
    bs.period_end,
    CASE 
        WHEN b.budget_amount > 0 THEN 
            ROUND((bs.total_spent / b.budget_amount * 100), 2)
        ELSE 0 
    END as percentage_used,
    CASE 
        WHEN bs.total_spent >= b.budget_amount THEN 'exceeded'
        WHEN (bs.total_spent / b.budget_amount * 100) >= b.alert_threshold_percentage THEN 'warning'
        ELSE 'normal'
    END as status
FROM tblbudget b
LEFT JOIN tblcategory c ON b.category_id = c.id
LEFT JOIN tblbudgetspending bs ON b.id = bs.budget_id 
    AND bs.period_start <= CURRENT_DATE 
    AND bs.period_end >= CURRENT_DATE
WHERE b.is_active = true;

-- Insert default notification preferences for existing users without preferences
INSERT INTO tblnotificationpreference (user_id, email_alerts, push_alerts, sms_alerts)
SELECT id, true, true, false 
FROM tbluser 
WHERE id NOT IN (SELECT user_id FROM tblnotificationpreference WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
