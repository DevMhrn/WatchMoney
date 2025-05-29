import React from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import Title from "./Title";

export const Chart = ({ data }) => {
    return (
        <div className="flex-1 w-full p-4 bg-white rounded-lg shadow-sm dark:bg-gray-800">
            <Title title="Transaction Activity" />
            
            <ResponsiveContainer width="100%" height={500} className="mt-5">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                    <XAxis 
                        dataKey="label" 
                        padding={{ left: 30, right: 30 }}
                        stroke="#888888"
                    />
                    <YAxis stroke="#888888" />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#4F46E5"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 8 }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="expense" 
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default Chart;
