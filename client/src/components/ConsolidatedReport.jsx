import React, { useState, useEffect } from 'react';
import { BiLoader } from 'react-icons/bi';
import { toast } from 'sonner';
import currencyService from '../services/currencyService';
import { formatCurrency } from '../libs';
import { useStore } from '../store';

const ConsolidatedReport = () => {
    const { user } = useStore((state) => state);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || 'USD');
    const [currencies, setCurrencies] = useState([]);

    useEffect(() => {
        loadSupportedCurrencies();
        loadConsolidatedReport();
    }, [selectedCurrency]);

    const loadSupportedCurrencies = async () => {
        try {
            const supportedCurrencies = await currencyService.getSupportedCurrencies();
            setCurrencies(supportedCurrencies);
        } catch (error) {
            console.error('Failed to load currencies');
        }
    };

    const loadConsolidatedReport = async () => {
        try {
            setLoading(true);
            const reportData = await currencyService.getConsolidatedReport(selectedCurrency);
            setReport(reportData.data);
        } catch (error) {
            toast.error('Failed to load consolidated report');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <BiLoader className="animate-spin text-2xl" />
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300">
                    Consolidated Report
                </h3>
                <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="rounded-lg border border-gray-300 py-1 px-3 text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
                >
                    {currencies.map(currency => (
                        <option key={currency} value={currency}>
                            {currency}
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-400">
                        Total Balance
                    </h4>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {currencyService.formatCurrencyWithSymbol(report.totalBalance, report.currency)}
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400">
                        Total Income
                    </h4>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {currencyService.formatCurrencyWithSymbol(report.totalIncome, report.currency)}
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-400">
                        Total Expenses
                    </h4>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                        {currencyService.formatCurrencyWithSymbol(report.totalExpense, report.currency)}
                    </p>
                </div>
            </div>

            <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-300 mb-4">
                    Account Breakdown
                </h4>
                <div className="space-y-3">
                    {report.accounts?.map((account, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-300">
                                    {account.type_name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Original: {currencyService.formatCurrencyWithSymbol(account.original_balance, account.original_currency)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-gray-300">
                                    {currencyService.formatCurrencyWithSymbol(account.converted_balance, account.target_currency)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    in {account.target_currency}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConsolidatedReport;
