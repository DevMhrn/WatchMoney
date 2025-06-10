import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import Title from "./Title";
import { formatCurrency } from "../libs";

export const Chart = ({ data, currency = "USD" }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-lg rounded-lg border dark:bg-gray-800 dark:border-gray-700 transition-all duration-200">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {entry.dataKey}:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(entry.value, currency)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full md:w-2/3 p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <Title title="Monthly Overview" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {currency}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="#4F46E5"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor="#4F46E5"
                                stopOpacity={0}
                            />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="5%"
                                stopColor="#EF4444"
                                stopOpacity={0.3}
                            />
                            <stop
                                offset="95%"
                                stopColor="#EF4444"
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="label"
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                    />
                    <YAxis
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                        tickFormatter={(value) => formatCurrency(value, currency)}
                    />
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#4F46E5"
                        strokeWidth={3}
                        fill="url(#colorIncome)"
                        name="Income"
                        animationBegin={200}
                        animationDuration={500}
                        animationEasing="ease-in-out"
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#EF4444"
                        strokeWidth={3}
                        fill="url(#colorExpense)"
                        name="Expense"
                        animationBegin={400}
                        animationDuration={500}
                        animationEasing="ease-in-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Chart;
