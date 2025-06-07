import { pool } from "../config/dbConfig.js";
import currencyService from "../services/currencyService.js";

export const getExchangeRates = async (req, res) => {
    try {
        const { from, to } = req.query;
        
        if (from && to) {
            const rate = await currencyService.getExchangeRate(from, to);
            return res.status(200).json({
                status: true,
                data: {
                    from,
                    to,
                    rate,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Get all cached rates
        const rates = await pool.query({
            text: 'SELECT * FROM tblexchangerate ORDER BY updated_at DESC',
            values: []
        });

        return res.status(200).json({
            status: true,
            data: rates.rows
        });
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch exchange rates",
            error: error.message
        });
    }
};

export const getSupportedCurrencies = async (req, res) => {
    try {
        const currencies = await currencyService.getAllSupportedCurrencies();
        return res.status(200).json({
            status: true,
            data: currencies
        });
    } catch (error) {
        console.error('Error fetching supported currencies:', error);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch supported currencies",
            error: error.message
        });
    }
};

export const getConsolidatedReport = async (req, res) => {
    try {
        const { userId } = req.body.user;
        const { currency } = req.query;
        
        const userCurrency = currency || req.body.user.currency || 'USD';

        // Get consolidated balance
        const totalBalance = await currencyService.getConsolidatedBalance(userId, userCurrency);

        // Get income/expense totals in target currency
        const transactions = await pool.query({
            text: 'SELECT type, amount, currency FROM tbltransaction WHERE user_id = $1',
            values: [userId]
        });

        let totalIncome = 0;
        let totalExpense = 0;

        for (const transaction of transactions.rows) {
            const convertedAmount = await currencyService.convertAmount(
                parseFloat(transaction.amount),
                transaction.currency,
                userCurrency
            );

            if (transaction.type === 'income') {
                totalIncome += convertedAmount;
            } else if (transaction.type === 'expense') {
                totalExpense += convertedAmount;
            }
        }

        // Get account breakdown
        const accounts = await pool.query({
            text: `SELECT a.*, at.type_name 
                   FROM tblaccount a 
                   JOIN tblaccounttype at ON a.account_type_id = at.id 
                   WHERE a.user_id = $1 AND a.is_active = true`,
            values: [userId]
        });

        const accountBreakdown = [];
        for (const account of accounts.rows) {
            const convertedBalance = await currencyService.convertAmount(
                parseFloat(account.account_balance),
                account.currency,
                userCurrency
            );

            accountBreakdown.push({
                ...account,
                original_balance: account.account_balance,
                original_currency: account.currency,
                converted_balance: convertedBalance,
                target_currency: userCurrency
            });
        }

        return res.status(200).json({
            status: true,
            data: {
                currency: userCurrency,
                totalBalance,
                totalIncome,
                totalExpense,
                netWorth: totalIncome - totalExpense,
                accounts: accountBreakdown,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error generating consolidated report:', error);
        return res.status(500).json({
            status: false,
            message: "Failed to generate consolidated report",
            error: error.message
        });
    }
};
