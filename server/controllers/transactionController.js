import { pool } from "../config/dbConfig.js";
import currencyService from "../services/currencyService.js";

const getMonthName = (index) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[index];
};

export const getTransactions = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { df, dt, s } = req.query;

        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const startDate = df ? new Date(df) : sevenDaysAgo;
        const endDate = dt ? new Date(dt) : today;
        
        // Add time to dates for complete day coverage
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const query = {
            text: `
                SELECT 
                    t.*,
                    to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as formatted_created_at
                FROM 
                    tbltransaction t
                WHERE 
                    t.user_id = $1 
                    AND t.created_at BETWEEN $2 AND $3
                    ${s ? `AND (
                        LOWER(t.description) LIKE LOWER($4) 
                        OR LOWER(t.status) LIKE LOWER($4) 
                        OR LOWER(t.source) LIKE LOWER($4)
                    )` : ''}
                ORDER BY 
                    t.created_at DESC
            `,
            values: s 
                ? [userId, startDate, endDate, `%${s}%`]
                : [userId, startDate, endDate]
        };

        const transactions = await pool.query(query);

        return res.status(200).json({
            status: true,
            data: transactions.rows,
            meta: {
                total: transactions.rows.length,
                dateRange: {
                    from: startDate,
                    to: endDate
                }
            }
        });
    } catch (error) {
        console.error('Transaction fetch error:', error);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch transactions",
            error: error.message
        });
    }
};

export const getDashboardInformation = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { currency } = req.query;
        
        // Get user's preferred currency
        const user = await pool.query({
            text: 'SELECT currency FROM tbluser WHERE id = $1',
            values: [userId]
        });
        
        const targetCurrency = currency || user.rows[0]?.currency || 'USD';
        
        // Get consolidated totals in target currency
        const consolidatedBalance = await currencyService.getConsolidatedBalance(userId, targetCurrency);
        
        // Get transaction totals with currency conversion
        const transactions = await pool.query({
            text: `SELECT type, amount, currency FROM tbltransaction WHERE user_id = $1`,
            values: [userId]
        });

        let totalIncome = 0;
        let totalExpense = 0;

        for (const transaction of transactions.rows) {
            const convertedAmount = await currencyService.convertAmount(
                parseFloat(transaction.amount),
                transaction.currency,
                targetCurrency
            );

            if (transaction.type === 'income') {
                totalIncome += convertedAmount;
            } else if (transaction.type === 'expense') {
                totalExpense += convertedAmount;
            }
        }

        // Get monthly data for current year with currency conversion
        const year = new Date().getFullYear();
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const result = await pool.query({
            text: `SELECT 
                    EXTRACT(MONTH FROM created_at) AS month,
                    type,
                    amount,
                    currency
                   FROM tbltransaction 
                   WHERE user_id = $1 
                   AND created_at BETWEEN $2 AND $3`,
            values: [userId, startDate, endDate]
        });

        // Format chart data with currency conversion
        const monthlyData = new Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        for (const transaction of result.rows) {
            const month = parseInt(transaction.month) - 1;
            const convertedAmount = await currencyService.convertAmount(
                parseFloat(transaction.amount),
                transaction.currency,
                targetCurrency
            );

            if (transaction.type === 'income') {
                monthlyData[month].income += convertedAmount;
            } else if (transaction.type === 'expense') {
                monthlyData[month].expense += convertedAmount;
            }
        }

        const data = monthlyData.map((monthData, index) => ({
            label: getMonthName(index),
            income: monthData.income,
            expense: monthData.expense,
        }));

        // Get recent data
        const [recentTransactions, recentAccounts] = await Promise.all([
            pool.query({
                text: `SELECT * FROM tbltransaction 
                       WHERE user_id = $1 
                       ORDER BY created_at DESC LIMIT 5`,
                values: [userId]
            }),
            pool.query({
                text: `SELECT * FROM tblaccount 
                       WHERE user_id = $1 
                       ORDER BY created_at DESC LIMIT 4`,
                values: [userId]
            })
        ]);

        return res.status(200).json({
            status: true,
            dashboard: {
                availableBalance: consolidatedBalance,
                totalIncome,
                totalExpense,
                currency: targetCurrency,
                chartData: data,
                lastTransactions: recentTransactions.rows,
                lastAccounts: recentAccounts.rows
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            status: false,
            error: error.message
        });
    }
};

export const addTransaction = async (req, res) => {
    // this addtransaction function is used to add a transaction to the database
    try {
        const { userId } = req.body.user;
        const { account_id } = req.params;
        const { description, source, amount } = req.body;

        if (!description || !source || !amount) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields"
            });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid amount"
            });
        }

        const accountResult = await pool.query({
            text: 'SELECT * FROM tblaccount WHERE id = $1 AND user_id = $2',
            values: [account_id, userId]
        });

        if (accountResult.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Account not found or unauthorized"
            });
        }

        const account = accountResult.rows[0];
        if (account.account_balance < numericAmount) {
            return res.status(400).json({
                status: false,
                message: "Transaction failed due to Insufficient balance"
            });
        }

        // Begin transaction
        await pool.query('BEGIN');
        try {
            await pool.query({
                text: `UPDATE tblaccount 
                       SET account_balance = account_balance - $1,
                           updated_at = CURRENT_TIMESTAMP 
                       WHERE id = $2`,
                values: [numericAmount, account_id]
            });

            await pool.query({
                text: `INSERT INTO tbltransaction 
                       (user_id, description, type, status, amount, source)
                       VALUES ($1, $2, $3, $4, $5, $6)`,
                values: [userId, description, 'expense', 'Completed', numericAmount, source]
            });

            await pool.query('COMMIT');

            return res.status(201).json({
                status: true,
                message: "Transaction completed successfully"
            });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            status: false,
            error: error.message
        });
    }
};

export const transferMoneyToAccount = async (req, res) => {
    const client = await pool.connect();

    try {
        const { userId } = req.body.user;
        const { from_account, to_account, amount, transfer_currency, exchange_rate = 1, converted_amount } = req.body;

        if (!from_account || !to_account || !amount) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields!!"
            });
        }

        const numericAmount = Number(amount);
        const numericExchangeRate = Number(exchange_rate);
        
        // Fix: Use the correct converted amount for balance checking
        // If transfer currency is different from account currency, use converted_amount
        // Otherwise, use the original amount
        let actualDeductAmount;
        
        if (converted_amount && transfer_currency) {
            actualDeductAmount = Number(converted_amount);
        } else {
            actualDeductAmount = numericAmount;
        }

        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                status: false,
                message: "Invalid amount"
            });
        }

        await client.query('BEGIN');

        // Get both accounts with account type names using JOIN
        const [fromAccountResult, toAccountResult] = await Promise.all([
            client.query({
                text: `SELECT a.*, at.type_name 
                       FROM tblaccount a 
                       JOIN tblaccounttype at ON a.account_type_id = at.id 
                       WHERE a.id = $1 AND a.user_id = $2 FOR UPDATE`,
                values: [from_account, userId]
            }),
            client.query({
                text: `SELECT a.*, at.type_name 
                       FROM tblaccount a 
                       JOIN tblaccounttype at ON a.account_type_id = at.id 
                       WHERE a.id = $1 AND a.user_id = $2 FOR UPDATE`,
                values: [to_account, userId]
            })
        ]);

        if (fromAccountResult.rows.length === 0 || toAccountResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                status: false,
                message: "One or both accounts not found or unauthorized"
            });
        }

        const fromAccount = fromAccountResult.rows[0];
        const toAccount = toAccountResult.rows[0];

        // Fix: Check balance using the correct amount in account's currency
        console.log('Balance Check:', {
            accountBalance: fromAccount.account_balance,
            deductAmount: actualDeductAmount,
            transferAmount: numericAmount,
            transferCurrency: transfer_currency,
            accountCurrency: fromAccount.currency
        });

        if (fromAccount.account_balance < actualDeductAmount) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                status: false,
                message: `Insufficient balance. Required: ${actualDeductAmount} ${fromAccount.currency}, Available: ${fromAccount.account_balance} ${fromAccount.currency}`
            });
        }

        // Update accounts - deduct from source account in its currency
        await client.query({
            text: `UPDATE tblaccount 
                   SET account_balance = account_balance - $1,
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE id = $2 RETURNING *`,
            values: [actualDeductAmount, from_account]
        });

        // Convert transfer amount to destination account currency if needed
        let toAccountAmount = numericAmount;
        if (transfer_currency !== toAccount.currency) {
            // Get exchange rate from transfer currency to destination currency
            const destinationRate = await currencyService.getExchangeRate(transfer_currency, toAccount.currency);
            toAccountAmount = numericAmount * destinationRate;
        }

        // Add to destination account in its currency
        await client.query({
            text: `UPDATE tblaccount 
                   SET account_balance = account_balance + $1,
                       updated_at = CURRENT_TIMESTAMP 
                   WHERE id = $2 RETURNING *`,
            values: [toAccountAmount, to_account]
        });

        // Create transaction records
        await Promise.all([
            // Debit transaction - record in transfer currency but show deducted amount
            client.query({
                text: `INSERT INTO tbltransaction 
                       (user_id, account_id, description, type, status, amount, source, currency, exchange_rate, base_currency_amount)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                values: [
                    userId,
                    from_account,
                    `Transfer to ${toAccount.type_name}`,
                    'expense',
                    'Completed',
                    numericAmount, // Amount in transfer currency
                    fromAccount.type_name,
                    transfer_currency || fromAccount.currency,
                    numericExchangeRate,
                    actualDeductAmount // Actual amount deducted from account
                ]
            }),
            // Credit transaction in destination account currency
            client.query({
                text: `INSERT INTO tbltransaction 
                       (user_id, account_id, description, type, status, amount, source, currency, base_currency_amount)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                values: [
                    userId,
                    to_account,
                    `Transfer from ${fromAccount.type_name}`,
                    'income',
                    'Completed',
                    toAccountAmount,
                    toAccount.type_name,
                    toAccount.currency,
                    toAccountAmount
                ]
            })
        ]);

        await client.query('COMMIT');

        return res.status(201).json({
            status: true,
            message: "Transfer completed successfully"
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Transfer error:", error);
        return res.status(500).json({
            status: false,
            message: "Transfer failed. Please try again.",
            error: error.message
        });
    } finally {
        client.release();
    }
};
