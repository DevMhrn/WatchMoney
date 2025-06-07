import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import api from '../libs/apiCalls';
import { formatCurrency, getCurrencySymbol } from '../libs';
import DialogWrapper from './wrappers/dialog-wrapper';
import Input from './ui/input';
import { Button } from './ui/button';
import { BiLoader, BiMoney, BiPlus } from 'react-icons/bi';
import { MdAccountBalance } from 'react-icons/md';

const AddMoney = ({ isOpen, setIsOpen, id, refetch, selectedAccount }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm();
  const [loading, setLoading] = useState(false);

  const submitHandler = async (data) => {
    try {
      setLoading(true);
      const { data: res } = await api.put(`/accounts/add-money/${id}`, data);
      
      // Show success toast and close modal
      toast.success(res.message || 'Money added successfully!');
      setIsOpen(false);
      reset(); // Reset form
      await refetch();  // Refresh accounts list
      
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  function closeModal() {
    setIsOpen(false);
    reset(); // Reset form when closing
  }

  const watchedAmount = watch("amount");
  const accountCurrency = selectedAccount?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(accountCurrency);

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-gray-100 dark:border-slate-700">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BiMoney size={24} />
            </div>
            <div>
              <Dialog.Title as="h3" className="text-xl font-bold">
                Add Money
              </Dialog.Title>
              <p className="text-blue-100 text-sm">
                Top up your {selectedAccount?.type_name} account
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            {/* Amount Display Card */}
            {watchedAmount && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-blue-100 dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Amount to add</span>
                  <div className="flex items-center gap-2">
                    <MdAccountBalance className="text-blue-500" />
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(watchedAmount, accountCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount Input with Enhanced Styling */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enter Amount ({accountCurrency})
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 z-10 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-lg font-medium bg-gray-50 dark:bg-slate-800 pr-2">
                    {currencySymbol}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Amount is required!",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0"
                    }
                  })}
                  className="w-full py-3 pr-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                  style={{ 
                    paddingLeft: `${Math.max(currencySymbol.length * 14 + 24, 60)}px`
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Quick Amount Buttons */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Quick amounts
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setValue("amount", amount, { shouldValidate: true })}
                    className="py-2 px-3 bg-gray-100 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors duration-200 border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-slate-500"
                  >
                    {currencySymbol}{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                disabled={loading || !watchedAmount}
                type="submit"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <BiLoader className="text-xl animate-spin" />
                ) : (
                  <>
                    <BiPlus size={18} />
                    Add {watchedAmount ? formatCurrency(watchedAmount, accountCurrency) : "Money"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default AddMoney;
