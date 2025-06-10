import React from "react";

const Info = ({ title, subTitle }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between py-8 mb-4">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-black dark:text-gray-100 mb-2">
                    {title}
                </h1>
                {subTitle && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <span>{subTitle}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Info;
