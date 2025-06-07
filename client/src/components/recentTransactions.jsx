import React from "react";
import { IoCheckmarkDoneCircle } from "react-icons/io5";
import { RiProgress3Line } from "react-icons/ri";
import { TiWarning } from "react-icons/ti";
import { Link } from "react-router-dom";
import { formatCurrency } from "../libs";
import Title from "./Title";

const RecentTransactions = ({ data, searchTerm = "" }) => {
    const StatusIcon = ({ status }) => {
        switch (status) {
            case "Pending":
                return <RiProgress3Line className="text-amber-600" size={24} />;
            case "Completed":
                return <IoCheckmarkDoneCircle className="text-emerald-600" size={24} />;
            case "Rejected":
                return <TiWarning className="text-red-600" size={24} />;
            default:
                return null;
        }
    };

    const highlightText = (text, search) => {
        if (!search || !text) return text;

        const regex = new RegExp(`(${search})`, "gi");
        return text.replace(
            regex,
            '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>'
        );
    };

    return (
        <div className="flex-1 w-full py-20">
            <div className="flex items-center justify-between">
                <Title title="Latest Transactions" />
                <Link
                    to="/transactions"
                    className="text-sm text-gray-600 dark:text-gray-500 hover:text-blue-600 hover:underline mr-5"
                >
                    View All
                </Link>
            </div>

            <div className="mt-5 overflow-x-auto">
                <table className="w-full">
                    <thead className="w-full border-b border-gray-300 dark:border-gray-700">
                        <tr className="w-full text-left text-black dark:text-gray-400">
                            <th className="py-2">Date</th>
                            <th className="px-2 py-2">Description</th>
                            <th className="px-2 py-2">Status</th>
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((item, index) => (
                            <tr
                                key={index}
                                className="text-sm text-gray-600 border-b border-gray-200 dark:border-gray-700 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                <td className="py-4">
                                    {new Date(item.createdat).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-3">
                                    <div className="flex flex-col">
                                        <p className="text-base font-medium text-black dark:text-gray-400 line-clamp-1">
                                            {searchTerm ? (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: highlightText(
                                                            item?.description,
                                                            searchTerm
                                                        ),
                                                    }}
                                                />
                                            ) : (
                                                item?.description
                                            )}
                                        </p>
                                    </div>
                                </td>
                                <td className="flex items-center gap-2 px-2 py-3">
                                    <StatusIcon status={item?.status} />
                                    <span>{item?.status}</span>
                                </td>
                                <td className="px-2 py-3">
                                    <p className="line-clamp-1">
                                        {searchTerm ? (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: highlightText(item?.source, searchTerm),
                                                }}
                                            />
                                        ) : (
                                            item?.source
                                        )}
                                    </p>
                                </td>
                                <td className="flex items-center px-2 py-4 font-medium">
                                    <span
                                        className={
                                            item?.type === "income"
                                                ? "text-emerald-600"
                                                : "text-red-600"
                                        }
                                    >
                                        {item?.type === "income" ? "+" : "-"}
                                    </span>
                                    {formatCurrency(item?.amount, item?.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentTransactions;
