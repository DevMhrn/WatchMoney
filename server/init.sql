-- User table
CREATE TABLE tbluser (
    id SERIAL NOT NULL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50),
    contact VARCHAR(15), 
    password TEXT NOT NULL, -- Must be hashed!
    provider VARCHAR(10) NULL,
    country CHAR(2), -- Use ISO 3166-1 alpha-2 country codes
    currency CHAR(3) NOT NULL DEFAULT 'USD', -- Use ISO 4217 currency codes
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Account table
CREATE TABLE tblaccount (
    id SERIAL NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbluser(id),
    account_name VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_balance NUMERIC(10, 2) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transaction table
CREATE TABLE tbltransaction (
    id SERIAL NOT NULL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES tbluser(id),
    description TEXT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Completed', 'Failed')), -- Enforce allowed values
    source VARCHAR(100) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    type VARCHAR(10) NOT NULL DEFAULT 'income'
        CHECK (type IN ('income', 'expense', 'transfer')), -- Enforce allowed values
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
); 