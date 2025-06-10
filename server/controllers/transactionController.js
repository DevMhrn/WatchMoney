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
        
        const startTime = Date.now();
        
        // Get user's preferred currency from database in a single query
        const user = await pool.query({
            text: 'SELECT currency, firstname, lastname FROM tbluser WHERE id = $1',
            values: [userId]
        });
        
        const userCurrency = currency || user.rows[0]?.currency || 'USD';
        
        // Get all data in parallel for better performance
        const [accountsResult, transactionsResult, monthlyTransactionsResult] = await Promise.all([
            // Get accounts for consolidated balance
            pool.query({
                text: 'SELECT account_balance, currency FROM tblaccount WHERE user_id = $1 AND is_active = true',
                values: [userId]
            }),
            // Get all transactions for totals
            pool.query({
                text: `SELECT type, amount, currency FROM tbltransaction WHERE user_id = $1`,
                values: [userId]
            }),
            // Get monthly data for current year
            pool.query({
                text: `SELECT 
                        EXTRACT(MONTH FROM created_at) AS month,
                        type,
                        amount,
                        currency
                       FROM tbltransaction 
                       WHERE user_id = $1 
                       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
                values: [userId]
            })
        ]);

        // Get recent data in parallel
        const [recentTransactions, recentAccounts] = await Promise.all([
            pool.query({
                text: `SELECT * FROM tbltransaction 
                       WHERE user_id = $1 
                       ORDER BY created_at DESC LIMIT 5`,
                values: [userId]
            }),
            pool.query({
                text: `SELECT * FROM tblaccount 
                       WHERE user_id = $1 AND is_active = true
                       ORDER BY created_at DESC LIMIT 4`,
                values: [userId]
            })
        ]);

        // Batch currency conversion for better performance
        const accountConversions = accountsResult.rows.map(acc => ({
            amount: parseFloat(acc.account_balance),
            fromCurrency: acc.currency
        }));

        const transactionConversions = transactionsResult.rows.map(txn => ({
            amount: parseFloat(txn.amount),
            fromCurrency: txn.currency,
            type: txn.type
        }));

        const monthlyConversions = monthlyTransactionsResult.rows.map(txn => ({
            amount: parseFloat(txn.amount),
            fromCurrency: txn.currency,
            type: txn.type,
            month: parseInt(txn.month) - 1
        }));

        // Process conversions in batches
        const [accountResults, transactionResults, monthlyResults] = await Promise.all([
            currencyService.batchConvertAmounts(accountConversions, userCurrency),
            currencyService.batchConvertAmounts(transactionConversions, userCurrency),
            currencyService.batchConvertAmounts(monthlyConversions, userCurrency)
        ]);

        // Calculate consolidated balance
        const consolidatedBalance = accountResults.reduce((sum, result) => sum + result.convertedAmount, 0);

        // Calculate transaction totals
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactionResults.forEach((result, index) => {
            const type = transactionConversions[index].type;
            if (type === 'income') {
                totalIncome += result.convertedAmount;
            } else if (type === 'expense') {
                totalExpense += result.convertedAmount;
            }
        });

        // Format chart data
        const monthlyData = new Array(12).fill().map(() => ({ income: 0, expense: 0 }));
        
        monthlyResults.forEach((result, index) => {
            const { type, month } = monthlyConversions[index];
            if (type === 'income') {
                monthlyData[month].income += result.convertedAmount;
            } else if (type === 'expense') {
                monthlyData[month].expense += result.convertedAmount;
            }
        });

        const chartData = monthlyData.map((monthData, index) => ({
            label: getMonthName(index),
            income: monthData.income,
            expense: monthData.expense,
        }));

        const endTime = Date.now();
        console.log(`Dashboard data fetched in ${endTime - startTime}ms`);

        return res.status(200).json({
            status: true,
            dashboard: {
                availableBalance: consolidatedBalance,
                totalIncome,
                totalExpense,
                currency: userCurrency,
                chartData: chartData,
                lastTransactions: recentTransactions.rows,
                lastAccounts: recentAccounts.rows,
                user: {
                    name: `${user.rows[0]?.firstname} ${user.rows[0]?.lastname}`,
                    currency: userCurrency
                }
            },
            meta: {
                processingTime: endTime - startTime,
                dataPoints: {
                    accounts: accountsResult.rows.length,
                    transactions: transactionsResult.rows.length,
                    monthlyTransactions: monthlyTransactionsResult.rows.length
                }
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
    try {
        const { userId } = req.body.user;
        const { account_id } = req.params;
        const { description, source, amount, category, category_id } = req.body;

        console.log('Transaction request received:', {
            userId,
            account_id,
            description,
            source,
            amount,
            category,
            category_id
        });

        if (!description || !amount) {
            return res.status(400).json({
                status: false,
                message: "Please provide all required fields (description and amount are required)"
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
            text: 'SELECT a.*, at.type_name FROM tblaccount a JOIN tblaccounttype at ON a.account_type_id = at.id WHERE a.id = $1 AND a.user_id = $2',
            values: [account_id, userId]
        });

        if (accountResult.rows.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Account not found or unauthorized"
            });
        }

        const account = accountResult.rows[0];
        const finalSource = source || account.type_name || 'Unknown Account';

        if (account.account_balance < numericAmount) {
            return res.status(400).json({
                status: false,
                message: "Transaction failed due to Insufficient balance"
            });
        }

        // Begin database transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Update account balance
            const updateAccountResult = await client.query({
                text: `UPDATE tblaccount 
                       SET account_balance = account_balance - $1,
                           updated_at = CURRENT_TIMESTAMP 
                       WHERE id = $2
                       RETURNING account_balance`,
                values: [numericAmount, account_id]
            });

            console.log('Account updated, new balance:', updateAccountResult.rows[0]?.account_balance);

            // Insert transaction record with category name and category ID
            const transactionResult = await client.query({
                text: `INSERT INTO tbltransaction 
                       (user_id, account_id, description, type, status, amount, source, 
                       category, category_id, currency)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                       RETURNING *`,
                values: [
                    userId, 
                    account_id, 
                    description, 
                    'expense', 
                    'Completed', 
                    numericAmount, 
                    finalSource, 
                    category || null, // Store category name in transaction
                    category_id || null, // Store category ID in transaction
                    account.currency
                ]
            });

            console.log('Transaction inserted:', transactionResult.rows[0]?.id);

            await client.query('COMMIT');
            
            const newTransaction = transactionResult.rows[0];

            // Only call budget service for EXPENSE transactions with a category_id
            if (category_id && newTransaction.type === 'expense') {
                // Call budget service asynchronously (don't block the response)
                setImmediate(async () => {
                    try {
                        console.log(`💰 Processing expense transaction for budget check: ${category} (ID: ${category_id}) - ${numericAmount} ${account.currency}`);
                        
                        // Get budget currency to convert transaction amount
                        const budgetQuery = await pool.query({
                            text: 'SELECT currency FROM tblbudget WHERE category_id = $1 AND user_id = $2 AND is_active = true LIMIT 1',
                            values: [category_id, userId]
                        });
                        
                        let convertedAmount = numericAmount;
                        let targetCurrency = account.currency;
                        
                        // Convert currency if budget exists and uses different currency
                        if (budgetQuery.rows.length > 0) {
                            const budgetCurrency = budgetQuery.rows[0].currency;
                            targetCurrency = budgetCurrency;
                            
                            if (account.currency !== budgetCurrency) {
                                console.log(`🔄 Converting transaction amount: ${numericAmount} ${account.currency} to ${budgetCurrency}`);
                                convertedAmount = await currencyService.convertAmount(
                                    numericAmount,
                                    account.currency,
                                    budgetCurrency
                                );
                                console.log(`✅ Converted amount: ${convertedAmount} ${budgetCurrency}`);
                            } else {
                                console.log(`ℹ️ No conversion needed: both transaction and budget use ${budgetCurrency}`);
                            }
                        }
                        
                        const budgetServiceUrl = process.env.BUDGET_SERVICE_URL ;
                        const requestBody = {
                            user_id: userId,
                            category_id: category_id,
                            amount: convertedAmount, // Send converted amount in budget currency
                            transaction_type: 'expense',
                            transaction_date: newTransaction.created_at,
                            description: description
                        };

                        console.log('📤 Sending to budget service with currency conversion:', {
                            original: `${numericAmount} ${account.currency}`,
                            converted: `${convertedAmount} ${targetCurrency}`,
                            category_id
                        });

                        const budgetCheckResponse = await fetch(`${budgetServiceUrl}/api/transactions`, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': req.headers.authorization
                            },
                            body: JSON.stringify(requestBody)
                        });

                        const responseText = await budgetCheckResponse.text();
                        
                        if (budgetCheckResponse.ok) {
                            const budgetResult = JSON.parse(responseText);
                            console.log('✅ Budget check completed:', budgetResult.message);
                            
                            if (budgetResult.data?.budgetChecks?.length > 0) {
                                const alertsSent = budgetResult.data.budgetChecks.filter(bc => bc.alertSent).length;
                                if (alertsSent > 0) {
                                    console.log(`📧 ${alertsSent} budget alert(s) sent for transaction`);
                                }
                            }
                        } else {
                            console.error('⚠️ Budget service check failed:', {
                                status: budgetCheckResponse.status,
                                statusText: budgetCheckResponse.statusText,
                                response: responseText,
                                requestBody
                            });
                        }
                    } catch (budgetError) {
                        console.error('❌ Budget service error (transaction was successful):', budgetError.message);
                    }
                });
            } else {
                console.log(`ℹ️ Skipping budget check - Transaction type: ${newTransaction.type}, Category ID: ${category_id || 'none'}`);
            }

            return res.status(201).json({
                status: true,
                message: "Transaction completed successfully",
                transaction: newTransaction
            });

        } catch (dbError) {
            await client.query('ROLLBACK');
            console.error('Database transaction error:', dbError);
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Transaction controller error:', error);
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
