-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table
CREATE TABLE tbluser (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(120) UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50),
    contact VARCHAR(15), 
    password TEXT NOT NULL, -- Must be hashed!
    provider VARCHAR(10) NULL,
    country CHAR(2), -- Use ISO 3166-1 alpha-2 country codes
    currency CHAR(3) NOT NULL DEFAULT 'USD', -- Use ISO 4217 currency codes
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account Types table (created before account table for foreign key dependency)
CREATE TABLE tblaccounttype (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    icon_name VARCHAR(50), -- For storing icon references
    color_code VARCHAR(7), -- For storing hex color codes like #FF5733
    sort_order INTEGER DEFAULT 0, -- For custom ordering
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account table
CREATE TABLE tblaccount (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    account_type_id UUID NOT NULL REFERENCES tblaccounttype(id) ON DELETE RESTRICT,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure user can't have duplicate account types
    CONSTRAINT unique_user_account_type UNIQUE(user_id, account_type_id)
);

-- Transaction table
CREATE TABLE tbltransaction (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES tbluser(id) ON DELETE CASCADE,
    account_id UUID REFERENCES tblaccount(id) ON DELETE SET NULL, -- Link to specific account
    transaction_reference VARCHAR(100) UNIQUE, -- For external reference tracking
    description TEXT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
    source VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'income'
        CHECK (type IN ('income', 'expense', 'transfer')),
    category VARCHAR(50), -- For categorizing transactions
    tags TEXT[], -- Array of tags for flexible categorization
    metadata JSONB, -- For storing additional transaction data
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for transaction categorization
CREATE TABLE tblcategory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES tbluser(id) ON DELETE CASCADE, -- NULL for system categories
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    icon_name VARCHAR(50),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    is_system BOOLEAN NOT NULL DEFAULT false, -- System vs user-defined categories
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category UNIQUE(user_id, name, type)
);

-- Indexes for better performance
CREATE INDEX idx_tbluser_email ON tbluser(email);
CREATE INDEX idx_tblaccount_user_id ON tblaccount(user_id);
CREATE INDEX idx_tblaccount_account_number ON tblaccount(account_number);
CREATE INDEX idx_tbltransaction_user_id ON tbltransaction(user_id);
CREATE INDEX idx_tbltransaction_account_id ON tbltransaction(account_id);
CREATE INDEX idx_tbltransaction_created_at ON tbltransaction(created_at DESC);
CREATE INDEX idx_tbltransaction_type ON tbltransaction(type);
CREATE INDEX idx_tbltransaction_status ON tbltransaction(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_tbluser_updated_at BEFORE UPDATE ON tbluser FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tblaccount_updated_at BEFORE UPDATE ON tblaccount FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tbltransaction_updated_at BEFORE UPDATE ON tbltransaction FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tblaccounttype_updated_at BEFORE UPDATE ON tblaccounttype FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tblcategory_updated_at BEFORE UPDATE ON tblcategory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default account types
INSERT INTO tblaccounttype (type_name, description, icon_name, color_code, sort_order) VALUES
('Cash', 'Physical cash account', 'cash', '#4CAF50', 1),
('Savings Account', 'Bank savings account', 'savings', '#2196F3', 2),
('Checking Account', 'Bank checking account', 'checking', '#FF9800', 3),
('Credit Card', 'Credit card account', 'credit-card', '#F44336', 4),
('Crypto', 'Cryptocurrency wallet', 'crypto', '#9C27B0', 5),
('PayPal', 'PayPal digital wallet', 'paypal', '#00BCD4', 6),
('Visa Debit Card', 'Visa debit card account', 'visa-debit-card', '#3F51B5', 7),
('Mastercard', 'Mastercard account', 'mastercard', '#FF5722', 8),
('Investment', 'Investment account', 'investment', '#795548', 9),
('Business', 'Business account', 'business', '#607D8B', 10);

-- Insert default system categories
INSERT INTO tblcategory (name, description, color_code, icon_name, type, is_system) VALUES
-- Income categories
('Salary', 'Regular employment income', '#4CAF50', 'salary', 'income', true),
('Freelance', 'Freelance work income', '#8BC34A', 'freelance', 'income', true),
('Investment', 'Investment returns', '#009688', 'investment', 'income', true),
('Business', 'Business income', '#00BCD4', 'business', 'income', true),
('Gift', 'Gifts received', '#03A9F4', 'gift', 'income', true),
('Other Income', 'Other sources of income', '#2196F3', 'other', 'income', true),

-- Expense categories
('Food & Dining', 'Food and restaurant expenses', '#FF5722', 'food', 'expense', true),
('Transportation', 'Transport and fuel costs', '#FF9800', 'transport', 'expense', true),
('Shopping', 'Shopping and retail purchases', '#FFC107', 'shopping', 'expense', true),
('Entertainment', 'Entertainment and leisure', '#FFEB3B', 'entertainment', 'expense', true),
('Bills & Utilities', 'Monthly bills and utilities', '#CDDC39', 'bills', 'expense', true),
('Healthcare', 'Medical and health expenses', '#8BC34A', 'healthcare', 'expense', true),
('Education', 'Education and learning costs', '#4CAF50', 'education', 'expense', true),
('Travel', 'Travel and vacation expenses', '#009688', 'travel', 'expense', true),
('Insurance', 'Insurance premiums', '#00BCD4', 'insurance', 'expense', true),
('Other Expense', 'Other miscellaneous expenses', '#607D8B', 'other', 'expense', true),

-- Budget categories
('General Budget', 'General purpose budget category', '#9C27B0', 'budget', 'budget', true),
('Emergency Fund', 'Emergency fund budget', '#F44336', 'emergency', 'budget', true),
('Vacation Fund', 'Vacation savings budget', '#FF9800', 'vacation', 'budget', true),
('Home Improvement', 'Home improvement projects', '#795548', 'home', 'budget', true),
('Car Fund', 'Car purchase or maintenance fund', '#607D8B', 'car', 'budget', true)
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Update the constraint to include budget type
ALTER TABLE tblcategory DROP CONSTRAINT IF EXISTS tblcategory_type_check;
ALTER TABLE tblcategory ADD CONSTRAINT tblcategory_type_check 
    CHECK (type IN ('income', 'expense', 'transfer', 'budget'));

-- Views for common queries
-- CREATE VIEW v_account_summary AS
-- SELECT 
--     a.id,
--     a.account_number,
--     a.account_balance,
--     a.is_active,
--     a.created_at,
--     u.email,
--     u.firstName,
--     u.lastName,
--     at.type_name,
--     at.description as account_type_description,
--     at.icon_name,
--     at.color_code
-- FROM tblaccount a
-- JOIN tbluser u ON a.user_id = u.id
-- JOIN tblaccounttype at ON a.account_type_id = at.id;

-- CREATE VIEW v_transaction_summary AS
-- SELECT 
--     t.id,
--     t.transaction_reference,
--     t.description,
--     t.amount,
--     t.type,
--     t.status,
--     t.source,
--     t.category,
--     t.created_at,
--     u.email,
--     u.firstName,
--     u.lastName,
--     a.account_number,
--     at.type_name as account_type
-- FROM tbltransaction t
-- JOIN tbluser u ON t.user_id = u.id
-- LEFT JOIN tblaccount a ON t.account_id = a.id
-- LEFT JOIN tblaccounttype at ON a.account_type_id = at.id;