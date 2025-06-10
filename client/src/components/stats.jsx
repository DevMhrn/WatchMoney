import React from "react";
import { BsCashCoin, BsCurrencyDollar } from "react-icons/bs";
import { SiCashapp } from "react-icons/si";
import { formatCurrency } from "../libs";
import { Card } from "./ui/card";

const ICON_STYLES = [
    "bg-blue-300 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "bg-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    "bg-rose-300 text-rose-800 dark:bg-rose-900 dark:text-rose-300"
];

const Stats = ({ balance, income, expense, currency = 'USD' }) => {
    const data = [
        {
            label: "Total Balance",
            amount: balance,
            icon: <BsCurrencyDollar size={26} />,
            currency: currency
        },
        {
            label: "Total Income",
            amount: income,
            icon: <BsCashCoin size={26} />,
            currency: currency
        },
        {
            label: "Total Expense",
            amount: expense,
            icon: <SiCashapp size={26} />,
            currency: currency
        }
    ];

    const ItemCard = ({ item, index }) => (
        <Card className="flex items-center justify-between w-full h-48 gap-5 px-4 py-12 shadow-lg 2xl:min-w-96 2xl:px-8 dark:border-gray-800">
            <div className="flex items-center w-full h-full gap-4">
                <div className={`w-12 h-12 flex items-center justify-center rounded-full ${ICON_STYLES[index]}`}>
                    {item.icon}
                </div>
                <div className="space-y-3">
                    <span className="text-base text-gray-600 dark:text-gray-400 md:text-lg">
                        {item.label}
                    </span>
                    <p className="text-2xl font-medium text-black 2xl:text-3xl dark:text-gray-400">
                        {formatCurrency(item.amount, item.currency)}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 md:text-sm 2xl:text-base dark:text-gray-500">
                            {item.label}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            {item.currency}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="flex flex-col items-center justify-between gap-8 mb-20 md:flex-row 2xl:gap-x-40">
            <div className="flex flex-col items-center justify-between w-full gap-10 md:flex-row 2xl:gap-20">
                {data.map((item, index) => (
                    <ItemCard key={index} item={item} index={index} />
                ))}
            </div>
        </div>
    );
};

export default Stats;
