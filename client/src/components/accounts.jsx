import React from "react";
import { FaBtc, FaPaypal } from "react-icons/fa";
import { GiCash } from "react-icons/gi";
import { RiVisaLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { formatCurrency, maskAccountNumber } from "../libs";
import Title from "./Title";

const ICONS = {
    crypto: (
        <div className="w-12 h-12 bg-amber-600 text-white flex items-center justify-center rounded-full">
            <FaBtc size={26} />
        </div>
    ),
    "visa debit card": (
        <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-full">
            <RiVisaLine size={26} />
        </div>
    ),
    cash: (
        <div className="w-12 h-12 bg-rose-600 text-white flex items-center justify-center rounded-full">
            <GiCash size={26} />
        </div>
    ),
    paypal: (
        <div className="w-12 h-12 bg-blue-700 text-white flex items-center justify-center rounded-full">
            <FaPaypal size={26} />
        </div>
    )
};

const Accounts = ({ data }) => {
    return (
        <div className="mt-20 md:mt-0 py-5 md:py-20 w-full md:w-1/3">
            <div className="flex items-center justify-between mb-6">
                <Title title="Accounts" />
                <Link
                    to="/accounts"
                    className="text-sm text-gray-600 dark:text-gray-500 hover:text-blue-600 hover:underline"
                >
                    View all accounts
                </Link>
            </div>

            <div className="w-full space-y-4">
                {data?.map((item, index) => (
                    <div
                        key={`${index}-${item?.account_name}`}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div>{ICONS[item?.account_name?.toLowerCase()]}</div>
                            <div>
                                <p className="text-black dark:text-gray-400 text-base 2xl:text-lg font-medium">
                                    {item.account_name}
                                </p>
                                <span className="text-gray-600 dark:text-gray-500 text-sm 2xl:text-base">
                                    {maskAccountNumber(item.account_number)}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg 2xl:text-xl text-black dark:text-gray-300 font-medium">
                                {formatCurrency(item?.account_balance)}
                            </p>
                            <span className="text-xs 2xl:text-sm text-gray-600 dark:text-gray-500">
                                Account Balance
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Accounts;
