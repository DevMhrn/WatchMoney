import { pool } from "../config/dbConfig.js";

export const getAccounts = async (req, res) => {
    try {
        const { userId } = req.body.user;

        const accounts = await pool.query({
            text: 'SELECT * FROM tblaccount WHERE user_id = $1',
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
        const { account_name, account_balance, account_number } = req.body;
        console.log("Account Name", account_name);
        console.log("Account Balance", account_balance);
        console.log("Account Number", account_number);

        if (!account_name || !account_balance || !account_number) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields"
            });
        }


        const existingAccount = await pool.query({
            text: 'SELECT * FROM tblaccount WHERE account_name = $1 AND user_id = $2',
            values: [account_name, userId]
        });

        if(existingAccount.rows[0]) {
            return res.status(400).json({ 
                status: false,
                message: "Account with this name already exists" 
            });
        }

        const newAccount = await pool.query({
            text: 'INSERT INTO tblaccount (user_id, account_name, account_number, account_balance) VALUES ($1, $2, $3, $4) RETURNING *',
            values: [userId, account_name, account_number, account_balance]
        });

        // Add initial deposit transaction
        const description = `${account_name} (Initial Deposit)`;
        await pool.query({
            text: 'INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)',
            values: [userId, description, 'income', 'Completed', account_balance, account_name]
        });

        return res.status(201).json({
            status: true,
            message: "${account_name} account created successfully",
            account: newAccount.rows[0]
        });
        
    } catch (error) {
        console.log(error);
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
        

        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid amount"
            }); 
        }

        const updatedAccount = await pool.query({
            text: 'UPDATE tblaccount SET account_balance = account_balance + $1, updatedat = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
            values: [amount, id, userId]

        });

        if (updatedAccount.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Account not found or unauthorized"
            });
        }

        const account = updatedAccount.rows[0];
        const description = `${account.account_name} (Deposit)`;

        await pool.query({
            text: 'INSERT INTO tbltransaction (user_id, description, type, status, amount, source) VALUES ($1, $2, $3, $4, $5, $6)',
            values: [userId, description, 'income', 'Completed', amount, account.account_name]
        });

        return res.status(200).json({
            status: true,
            message: "Amount added successfully",
            account: account
        });
        
    } catch (error) {
        console.log(error);
        return res.status(400).json({ 
            status: false,
            error: error.message
        });
    }
}


