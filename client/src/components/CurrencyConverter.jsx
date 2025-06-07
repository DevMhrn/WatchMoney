import React, { useState, useEffect } from 'react';
import { BiLoader, BiRefresh } from 'react-icons/bi';
import { toast } from 'sonner';
import currencyService from '../services/currencyService';
import { Button } from './ui/button';
import Input from './ui/input';

const CurrencyConverter = ({ isOpen, setIsOpen }) => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [convertedAmount, setConvertedAmount] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => {
        loadSupportedCurrencies();
    }, []);

    const loadSupportedCurrencies = async () => {
        try {
            const supportedCurrencies = await currencyService.getSupportedCurrencies();
            setCurrencies(supportedCurrencies);
        } catch (error) {
            toast.error('Failed to load currencies');
        }
    };

    const handleConvert = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            const rateData = await currencyService.getExchangeRates(fromCurrency, toCurrency);
            const rate = rateData.data.rate;
            const converted = parseFloat(amount) * rate;
            
            setExchangeRate(rate);
            setConvertedAmount(converted);
        } catch (error) {
            toast.error('Failed to convert currency');
        } finally {
            setLoading(false);
        }
    };

    const swapCurrencies = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
        setConvertedAmount(null);
        setExchangeRate(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">
                        Currency Converter
                    </h3>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <Input
                        type="number"
                        label="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="dark:bg-slate-800 dark:text-gray-300"
                    />

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                From
                            </label>
                            <select
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300"
                            >
                                {currencies.map(currency => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={swapCurrencies}
                            className="mt-6 p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            ⇄
                        </button>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                To
                            </label>
                            <select
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 px-3 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300"
                            >
                                {currencies.map(currency => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {convertedAmount !== null && (
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-300">
                                    {currencyService.formatCurrencyWithSymbol(convertedAmount, toCurrency)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    1 {fromCurrency} = {exchangeRate?.toFixed(6)} {toCurrency}
                                </p>
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleConvert}
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {loading ? (
                            <BiLoader className="animate-spin" />
                        ) : (
                            'Convert'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CurrencyConverter;
