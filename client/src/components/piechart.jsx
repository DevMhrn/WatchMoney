import React from "react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import Title from "./Title";
import { formatCurrency } from "../libs";

const COLORS = ["#4F46E5", "#EF4444"]; // Blue for income, Red for expense

const DoughnutChart = ({ dt, currency = "USD" }) => {
    const data = [
        { 
            name: "Income", 
            value: Number(dt?.income || 0),
            color: COLORS[0]
        },
        { 
            name: "Expense", 
            value: Number(dt?.expense || 0),
            color: COLORS[1]
        }
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-lg rounded-lg border dark:bg-gray-800 dark:border-gray-700 transition-all duration-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {payload[0].name}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payload[0].value, currency)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full md:w-1/3 p-6 rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all duration-500">
            <div className="flex items-center justify-between mb-4">
                <Title title="Income vs Expense" />
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {currency}
                </span>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry) => (
                            <span className="text-gray-600 dark:text-gray-400">
                                {value}
                            </span>
                        )}
                    />
                    <Pie
                        data={data}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={100}
                        animationDuration={750}
                        animationEasing="ease-in-out"
                        isAnimationActive={true}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index]}
                                stroke="none"
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DoughnutChart;
