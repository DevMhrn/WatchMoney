import { pool } from "../config/dbConfig.js";

class CurrencyService {
    constructor() {
        this.apiKey = process.env.EXCHANGE_RATE_API_KEY || null;
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
        this.fallbackUrl = 'https://api.fixer.io/latest';
    }

    async getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        try {
            // First, try to get from database (cached)
            const cachedRate = await this.getCachedExchangeRate(fromCurrency, toCurrency);
            if (cachedRate && this.isRateRecent(cachedRate.updated_at)) {
                return parseFloat(cachedRate.rate);
            }

            // If not cached or outdated, fetch from API
            const rate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);

            
            
            // Cache the rate
            await this.cacheExchangeRate(fromCurrency, toCurrency, rate);
            
            return rate;
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            
            // Fallback to cached rate even if outdated
            const fallbackRate = await this.getCachedExchangeRate(fromCurrency, toCurrency);
            if (fallbackRate) {
                return parseFloat(fallbackRate.rate);
            }
            
            // Final fallback
            return 1.0;
        }
    }

    async getCachedExchangeRate(fromCurrency, toCurrency) {
        const result = await pool.query({
            text: 'SELECT * FROM tblexchangerate WHERE from_currency = $1 AND to_currency = $2',
            values: [fromCurrency, toCurrency]
        });
        
        return result.rows[0] || null;
    }

    isRateRecent(updatedAt, hoursThreshold = 1) {
        const now = new Date();
        const rateTime = new Date(updatedAt);
        const hoursDiff = (now - rateTime) / (1000 * 60 * 60);
        return hoursDiff < hoursThreshold;
    }

    async fetchExchangeRateFromAPI(fromCurrency, toCurrency) {
        try {
            const response = await fetch(`${this.baseUrl}${fromCurrency}`);
            const data = await response.json();
            
            if (data.rates && data.rates[toCurrency]) {
                return parseFloat(data.rates[toCurrency]);
            }

            throw new Error(`Rate not found for ${fromCurrency} to ${toCurrency}`);
        } catch (error) {
            console.error('API fetch error:', error);
            throw error;
        }
    }

    async cacheExchangeRate(fromCurrency, toCurrency, rate) {
        await pool.query({
            text: `INSERT INTO tblexchangerate (from_currency, to_currency, rate, source) 
                   VALUES ($1, $2, $3, 'api') 
                   ON CONFLICT (from_currency, to_currency) 
                   DO UPDATE SET rate = $3, updated_at = CURRENT_TIMESTAMP, source = 'api'`,
            values: [fromCurrency, toCurrency, rate]
        });
    }

    async convertAmount(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        const rate = await this.getExchangeRate(fromCurrency, toCurrency);
        return amount * rate;
    }

    async getAllSupportedCurrencies() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            return Object.keys(data.rates || {});
        } catch (error) {
            console.error('Error fetching supported currencies:', error);
            return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
        }
    }

    async getConsolidatedBalance(userId, targetCurrency) {
        const accounts = await pool.query({
            text: 'SELECT account_balance, currency FROM tblaccount WHERE user_id = $1 AND is_active = true',
            values: [userId]
        });

        let totalBalance = 0;
        
        for (const account of accounts.rows) {
            const convertedAmount = await this.convertAmount(
                parseFloat(account.account_balance),
                account.currency,
                targetCurrency
            );
            totalBalance += convertedAmount;
        }

        return totalBalance;
    }
}

export default new CurrencyService();
