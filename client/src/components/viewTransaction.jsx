import { Dialog } from "@headlessui/react";
import React from "react";
import { PiSealCheckFill } from "react-icons/pi";
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
      <Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all'>
        <Dialog.Title
          as='h3'
          className='text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase'
        >
          Transaction Detail
        </Dialog.Title>
        
        <div className='space-y-3'>
          <div className='flex items-center gap-2 text-gray-600'>
            <p>{data?.source}</p>
            <PiSealCheckFill size={30} className='text-emerald-500 ml-4' />
          </div>

          <div className='mb-10'>
            <p className='text-xl text-black dark:text-white border-y border-gray-300 dark:border-gray-700 py-4'>
              {data?.description}
            </p>
            <span className='text-xs text-gray-600'>
              {longDateString} {longTimeString}
            </span>
          </div>

          <div className='mt-10 mb-3 flex justify-between items-center'>
            <div className="flex flex-col">
              <p className={`text-2xl font-bold ${
                data?.type === "income" 
                  ? "text-emerald-600" 
                  : "text-red-600"
              }`}>
                <span className="font-bold">
                  {data?.type === "income" ? "+" : "-"}
                </span>{" "}
                {formatCurrency(data?.amount, data?.currency)}
              </p>
              {data?.currency && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Currency: {data.currency}
                  {data?.exchange_rate && data.exchange_rate !== 1 && (
                    <span className="ml-2">
                      (Rate: {data.exchange_rate})
                    </span>
                  )}
                </span>
              )}
            </div>
            <button
              type='button'
              onClick={closeModal}
              className='rounded-md outline-none bg-violet-800 hover:bg-violet-700 px-4 py-2 text-sm font-medium text-white transition-colors'
            >
              Got it. 
            </button>
          </div>
        </div>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default ViewTransaction;
