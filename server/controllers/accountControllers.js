import { pool } from "../config/dbConfig.js";
import { v4 as uuidv4 } from 'uuid';

export const getAccounts = async (req, res) => {
    try {
        const { userId } = req.body.user;

        const accounts = await pool.query({
            text: `SELECT a.*, at.type_name, at.description, at.icon_name, at.color_code 
                   FROM tblaccount a 
                   JOIN tblaccounttype at ON a.account_type_id = at.id 
                   WHERE a.user_id = $1 AND a.is_active = true
                   ORDER BY a.created_at DESC`,
            values: [userId]
        });

        return res.status(200).json({ 
            status: true,
            accounts: accounts.rows
        });
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
}

export const createAccount = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { account_type_name, account_balance, account_number, currency } = req.body;
        
        console.log("Account Type Name", account_type_name);
        console.log("Account Balance", account_balance);
        console.log("Account Number", account_number);
        console.log("Currency", currency);

        if (!account_type_name || account_balance === undefined || !account_number) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields"
            });
        }

        // Validate amount
        const balance = parseFloat(account_balance);
        if (isNaN(balance) || balance < 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid account balance"
            });
        }

        // Get user's default currency if not provided
        const user = await pool.query({
            text: 'SELECT currency FROM tbluser WHERE id = $1',
            values: [userId]
        });

        const accountCurrency = currency || user.rows[0]?.currency || 'USD';

        // Get account type ID
        const accountType = await pool.query({
            text: 'SELECT id, type_name FROM tblaccounttype WHERE type_name = $1 AND is_active = true',
            values: [account_type_name]
        });

        if (accountType.rows.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid account type"
            });
        }

        const accountTypeId = accountType.rows[0].id;

        // Check if account number already exists (globally unique)
        const existingAccountNumber = await pool.query({
            text: 'SELECT id FROM tblaccount WHERE account_number = $1',
            values: [account_number]
        });

        if (existingAccountNumber.rows.length > 0) {
            return res.status(400).json({ 
                status: false,
                message: "Account number already exists. Please generate a new one." 
            });
        }

        // Check if user already has this account type
        const existingAccountType = await pool.query({
            text: 'SELECT id FROM tblaccount WHERE account_type_id = $1 AND user_id = $2 AND is_active = true',
            values: [accountTypeId, userId]
        });

        if (existingAccountType.rows.length > 0) {
            return res.status(400).json({ 
                status: false,
                message: `You already have a ${account_type_name} account. Each account type can only be created once.` 
            });
        }

        // Start transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Create account with currency
            const newAccount = await client.query({
                text: 'INSERT INTO tblaccount (user_id, account_type_id, account_number, account_balance, currency) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                values: [userId, accountTypeId, account_number, balance, accountCurrency]
            });

            // Add initial deposit transaction if balance > 0
            if (balance > 0) {
                const transactionRef = `INIT-${uuidv4().substring(0, 8).toUpperCase()}`;
                const description = `${account_type_name} (Initial Deposit)`;
                
                await client.query({
                    text: 'INSERT INTO tbltransaction (user_id, account_id, transaction_reference, description, type, status, amount, source, category, currency, base_currency_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                    values: [userId, newAccount.rows[0].id, transactionRef, description, 'income', 'Completed', balance, account_type_name, 'Other Income', accountCurrency, balance]
                });
            }

            await client.query('COMMIT');

            // Get the complete account info with type details
            const completeAccount = await pool.query({
                text: `SELECT a.*, at.type_name, at.description, at.icon_name, at.color_code 
                       FROM tblaccount a 
                       JOIN tblaccounttype at ON a.account_type_id = at.id 
                       WHERE a.id = $1`,
                values: [newAccount.rows[0].id]
            });

            return res.status(201).json({
                status: true,
                message: `${account_type_name} account created successfully`,
                account: completeAccount.rows[0]
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.log(error);
        
        // Handle unique constraint violations
        if (error.code === '23505') {
            if (error.constraint === 'tblaccount_account_number_key') {
                return res.status(400).json({ 
                    status: false,
                    message: "Account number already exists. Please generate a new one." 
                });
            }
            if (error.constraint === 'unique_user_account_type') {
                return res.status(400).json({ 
                    status: false,
                    message: "You already have an account of this type." 
                });
            }
        }
        
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
}

export const addMoneyToAccount = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.params;
        const { amount } = req.body;
        
        console.log("Account ID", id);
        console.log("Amount", amount);

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid amount"
            }); 
        }

        // Start transaction
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Update account balance
            const updatedAccount = await client.query({
                text: `UPDATE tblaccount 
                       SET account_balance = account_balance + $1, updated_at = CURRENT_TIMESTAMP 
                       WHERE id = $2 AND user_id = $3 AND is_active = true
                       RETURNING *`,
                values: [amountValue, id, userId]
            });

            if (updatedAccount.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    status: false,
                    message: "Account not found or unauthorized"
                });
            }

            // Get account type name for transaction
            const accountWithType = await client.query({
                text: `SELECT a.*, at.type_name 
                       FROM tblaccount a 
                       JOIN tblaccounttype at ON a.account_type_id = at.id 
                       WHERE a.id = $1`,
                values: [id]
            });

            const account = accountWithType.rows[0];
            const transactionRef = `DEP-${uuidv4().substring(0, 8).toUpperCase()}`;
            const description = `${account.type_name} (Deposit)`;

            // Create transaction record
            await client.query({
                text: 'INSERT INTO tbltransaction (user_id, account_id, transaction_reference, description, type, status, amount, source, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                values: [userId, id, transactionRef, description, 'income', 'Completed', amountValue, account.type_name, 'Other Income']
            });

            await client.query('COMMIT');

            return res.status(200).json({
                status: true,
                message: "Amount added successfully",
                account: account
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
}
export const deleteAccount = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { id } = req.params;

        // Soft delete - set is_active to false
        const deletedAccount = await pool.query({
            text: `UPDATE tblaccount 
                   SET is_active = false, updated_at = CURRENT_TIMESTAMP 
                   WHERE id = $1 AND user_id = $2 
                   RETURNING *`,
            values: [id, userId]
        });

        if (deletedAccount.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Account not found or unauthorized"
            });
        }

        return res.status(200).json({
            status: true,
            message: "Account deleted successfully"
        });
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
};