import React from "react";
import { FaSpinner } from "react-icons/fa";

const Loading = () => {
    return (
        <div className="w-full flex items-center justify-center py-2">
            <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400" size={28} />
        </div>
    );
};

export default Loading;
