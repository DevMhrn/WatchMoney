import { Dialog } from "@headlessui/react";
import React from "react";
import { PiSealCheckFill } from "react-icons/pi";
import { MdVerifiedUser, MdAccountBalance, MdCalendarToday, MdAccessTime } from "react-icons/md";
import { BiMoney, BiTransfer } from "react-icons/bi";
import { formatCurrency } from "../libs";
import DialogWrapper from "./wrappers/dialog-wrapper";

const ViewTransaction = ({ data, isOpen, setIsOpen }) => {
  function closeModal() {
    setIsOpen(false);
  }

  const longDateString = new Date(data?.createdat).toLocaleDateString("en-US", {
    dateStyle: "full",
  });

  const longTimeString = new Date(data?.createdat).toLocaleTimeString("en-US");

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className='w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-gray-100 dark:border-slate-700'>
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BiMoney size={24} />
            </div>
            <div>
              <Dialog.Title as="h3" className="text-xl font-bold">
                Transaction Details
              </Dialog.Title>
              <p className="text-violet-100 text-sm">
                Complete transaction information
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Amount Section */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              data?.type === "income" 
                ? "bg-emerald-100 dark:bg-emerald-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {data?.type === "income" ? (
                <BiTransfer size={32} className="text-emerald-600 dark:text-emerald-400 rotate-180" />
              ) : (
                <BiTransfer size={32} className="text-red-600 dark:text-red-400" />
              )}
            </div>
            
            <p className={`text-4xl font-bold mb-2 ${
              data?.type === "income" 
                ? "text-emerald-600 dark:text-emerald-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              <span className="font-bold">
                {data?.type === "income" ? "+" : "-"}
              </span>
              {formatCurrency(data?.amount, data?.currency)}
            </p>
            
            {data?.currency && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Currency: {data.currency}</span>
                {data?.exchange_rate && data.exchange_rate !== 1 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs">
                    Rate: {data.exchange_rate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Transaction Info Cards */}
          <div className="space-y-4 mb-6">
            {/* Description Card */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
              <div className="flex items-start gap-3">
                <MdAccountBalance className="text-gray-500 dark:text-gray-400 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 break-words">
                    {data?.description || "No description provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Source Card */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <MdVerifiedUser className="text-gray-500 dark:text-gray-400" size={20} />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Source Account</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700 dark:text-gray-300">{data?.source}</p>
                    <PiSealCheckFill size={20} className='text-emerald-500' />
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Time Card */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <MdCalendarToday className="text-gray-500 dark:text-gray-400" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Date</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{longDateString}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MdAccessTime className="text-gray-500 dark:text-gray-400" size={20} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Time</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{longTimeString}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              type='button'
              onClick={closeModal}
              className='py-3 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              Close Details
            </button>
          </div>
        </div>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default ViewTransaction;
