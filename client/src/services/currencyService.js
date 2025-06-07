import api from '../libs/apiCalls';

class CurrencyService {
    async getExchangeRates(from, to) {
        try {
            const { data } = await api.get(`/currency/exchange-rates?from=${from}&to=${to}`);
            return data;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            throw error;
        }
    }

    async getSupportedCurrencies() {
        try {
            const { data } = await api.get('/currency/supported-currencies');
            return data.data || [];
        } catch (error) {
            console.error('Error fetching supported currencies:', error);
            return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
        }
    }

    async getConsolidatedReport(currency) {
        try {
            const { data } = await api.get(`/currency/consolidated-report${currency ? `?currency=${currency}` : ''}`);
            return data;
        } catch (error) {
            console.error('Error fetching consolidated report:', error);
            throw error;
        }
    }

    formatCurrencyWithSymbol(amount, currency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
            minimumFractionDigits: 2,
        }).format(amount);
    }

    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹'
        };
        return symbols[currency] || currency;
    }
}

export default new CurrencyService();
