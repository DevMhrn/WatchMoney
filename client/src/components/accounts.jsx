import React from "react";
import { FaBtc, FaPaypal, FaCreditCard, FaBusinessTime, FaUniversity, FaMoneyBillWave, FaChartLine } from "react-icons/fa";
import { GiCash } from "react-icons/gi";
import { RiVisaLine, RiBankLine } from "react-icons/ri";
import { MdSavings, MdAccountBalance } from "react-icons/md";
import { SiMastercard } from "react-icons/si";
import { AiOutlineBank } from "react-icons/ai";
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
    ),
    "savings account": (
        <div className="w-12 h-12 bg-green-600 text-white flex items-center justify-center rounded-full">
            <MdSavings size={26} />
        </div>
    ),
    "checking account": (
        <div className="w-12 h-12 bg-orange-600 text-white flex items-center justify-center rounded-full">
            <RiBankLine size={26} />
        </div>
    ),
    "credit card": (
        <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center rounded-full">
            <FaCreditCard size={26} />
        </div>
    ),
    mastercard: (
        <div className="w-12 h-12 bg-red-500 text-white flex items-center justify-center rounded-full">
            <SiMastercard size={26} />
        </div>
    ),
    investment: (
        <div className="w-12 h-12 bg-purple-600 text-white flex items-center justify-center rounded-full">
            <FaChartLine size={26} />
        </div>
    ),
    business: (
        <div className="w-12 h-12 bg-slate-600 text-white flex items-center justify-center rounded-full">
            <FaBusinessTime size={26} />
        </div>
    ),
    // Default fallback icon
    default: (
        <div className="w-12 h-12 bg-gray-600 text-white flex items-center justify-center rounded-full">
            <AiOutlineBank size={26} />
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
                        key={`${index}-${item?.type_name}`}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div>{ICONS[item?.type_name?.toLowerCase()] || ICONS.default}</div>
                            <div>
                                <p className="text-black dark:text-gray-400 text-base 2xl:text-lg font-medium">
                                    {item.type_name}
                                </p>
                                <span className="text-gray-600 dark:text-gray-500 text-sm 2xl:text-base">
                                    {maskAccountNumber(item.account_number)}
                                </span>
                                {item.currency && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 ml-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                        {item.currency}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg 2xl:text-xl text-black dark:text-gray-300 font-medium">
                                {formatCurrency(item?.account_balance, item?.currency)}
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
