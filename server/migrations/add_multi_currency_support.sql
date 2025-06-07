-- Migration: Add multi-currency support
-- Run this migration to add currency support to existing tables

-- Add currency columns to existing tables
ALTER TABLE tblaccount ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE tbltransaction ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE tbltransaction ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 6) DEFAULT 1.0;
ALTER TABLE tbltransaction ADD COLUMN IF NOT EXISTS base_currency_amount NUMERIC(15, 2);

-- Create exchange rates table
CREATE TABLE IF NOT EXISTS tblexchangerate (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency CHAR(3) NOT NULL,
    to_currency CHAR(3) NOT NULL,
    rate NUMERIC(10, 6) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_currency_pair UNIQUE(from_currency, to_currency)
);

-- Create indexes for exchange rates
CREATE INDEX IF NOT EXISTS idx_exchange_rate_currencies ON tblexchangerate(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_updated ON tblexchangerate(updated_at DESC);

-- Create trigger for exchange rate updates
CREATE TRIGGER update_tblexchangerate_updated_at 
    BEFORE UPDATE ON tblexchangerate 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default exchange rates (USD as base)
INSERT INTO tblexchangerate (from_currency, to_currency, rate, source) VALUES
('USD', 'EUR', 0.85, 'default'),
('EUR', 'USD', 1.18, 'default'),
('USD', 'GBP', 0.73, 'default'),
('GBP', 'USD', 1.37, 'default'),
('USD', 'JPY', 110.0, 'default'),
('JPY', 'USD', 0.009, 'default'),
('USD', 'INR', 85.82, 'default'),
('INR', 'USD', 0.0117, 'default'),
('EUR', 'INR', 100.96, 'default'),
('INR', 'EUR', 0.0099, 'default')
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Update existing accounts to use user's currency
UPDATE tblaccount 
SET currency = u.currency 
FROM tbluser u 
WHERE tblaccount.user_id = u.id;

-- Update existing transactions to use account currency
UPDATE tbltransaction 
SET currency = COALESCE(
    (SELECT currency FROM tblaccount WHERE id = tbltransaction.account_id),
    (SELECT currency FROM tbluser WHERE id = tbltransaction.user_id)
),
base_currency_amount = amount
WHERE EXISTS (SELECT 1 FROM tbluser WHERE id = tbltransaction.user_id);
