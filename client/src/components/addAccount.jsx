import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BiLoader, BiPlus } from "react-icons/bi";
import { MdOutlineWarning, MdAccountBalance, MdVerifiedUser } from "react-icons/md";
import { Dialog } from "@headlessui/react";
import { FaUniversity, FaCreditCard } from "react-icons/fa";
import {useStore} from "../store";
import { generateAccountNumber, getCurrencySymbol } from "../libs";
import DialogWrapper from "./wrappers/dialog-wrapper";
import Input from "./ui/input";
import {Button} from "./ui/button";
import { Shimmer } from "./ui/shimmer";
import { toast } from 'sonner';
import api from '../libs/apiCalls';
import currencyService from '../services/currencyService';

export const AddAccount = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: { 
      account_number: generateAccountNumber(),
      currency: user?.currency || 'USD'
    },
  });

  const [accountTypes, setAccountTypes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);

  // Fetch account types from API
  const fetchAccountTypes = async () => {
    try {
      setTypesLoading(true);
      const { data: res } = await api.get("/account-type");
      setAccountTypes(res?.accountTypes || []);
      
      // Set first account type as default selection
      if (res?.accountTypes?.length > 0) {
        setSelectedAccount(res.accountTypes[0].type_name);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch account types");
      // Fallback to hardcoded values if API fails
      const fallbackTypes = [
        { type_name: "Cash", description: "Physical cash account" },
        { type_name: "Crypto", description: "Cryptocurrency wallet" },
        { type_name: "Paypal", description: "PayPal digital wallet" },
        { type_name: "Visa Debit Card", description: "Visa debit card account" },
        { type_name: "Mastercard", description: "Mastercard account" }
      ];
      setAccountTypes(fallbackTypes);
      setSelectedAccount(fallbackTypes[0].type_name);
    } finally {
      setTypesLoading(false);
    }
  };

  // Fetch supported currencies
  const fetchSupportedCurrencies = async () => {
    try {
      setCurrenciesLoading(true);
      const supportedCurrencies = await currencyService.getSupportedCurrencies();
      setCurrencies(supportedCurrencies || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      // Fallback currencies
      setCurrencies(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
    } finally {
      setCurrenciesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccountTypes();
      fetchSupportedCurrencies();
    }
  }, [isOpen]);

  // Add this function to check if account exists
  const isAccountExists = (accountName) => {
    if (!user?.accounts || !accountName) return false;
    return user.accounts.some(
      account => account?.name?.toLowerCase() === accountName.toLowerCase()
    );
  };

  // Update select handler to check account existence
  const handleAccountSelect = (e) => {
    const selected = e.target.value;
    setSelectedAccount(selected);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const newData = {
        account_type_name: selectedAccount,
        account_number: data.account_number,
        account_balance: data.amount,
        currency: data.currency
      };

      const { data: res } = await api.post('/accounts/create', newData);
      
      toast.success(res.message || 'Account created successfully!');
      setIsOpen(false);
      reset();
      await refetch();
      
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  const watchedAmount = watch("amount");
  const watchedCurrency = watch("currency");

  const currentCurrency = watchedCurrency || user?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currentCurrency);

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-gray-100 dark:border-slate-700">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MdAccountBalance size={24} />
            </div>
            <div>
              <Dialog.Title as="h3" className="text-xl font-bold">
                Create New Account
              </Dialog.Title>
              <p className="text-violet-100 text-sm">
                Set up your financial account
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Account Type
              </label>
              
              {typesLoading ? (
                <div className="space-y-3">
                  <Shimmer className="h-12 w-full rounded-xl" />
                  <div className="flex items-center gap-2">
                    <Shimmer className="w-4 h-4 rounded" />
                    <Shimmer className="h-3 w-32 rounded" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    onChange={handleAccountSelect}
                    value={selectedAccount}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose account type
                    </option>
                    {accountTypes.map((accountType, index) => (
                      <option
                        key={index}
                        value={accountType.type_name}
                        className="dark:bg-slate-800 dark:text-gray-300"
                      >
                        {accountType.type_name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FaCreditCard className="text-gray-400" size={16} />
                  </div>
                </div>
              )}

              {selectedAccount && isAccountExists(selectedAccount) && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-xl">
                  <MdOutlineWarning size={20} className="mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Account Already Exists</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This account type has already been activated. Please choose a different type.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Currency Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Currency
              </label>
              
              {currenciesLoading ? (
                <Shimmer className="h-12 w-full rounded-xl" />
              ) : (
                <div className="relative">
                  <select
                    {...register("currency", {
                      required: "Currency selection is required!",
                    })}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    {currencies.map((currency, index) => (
                      <option
                        key={index}
                        value={currency}
                        className="dark:bg-slate-800 dark:text-gray-300"
                      >
                        {currency}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-400 font-medium">{currencySymbol}</span>
                  </div>
                </div>
              )}
              {errors.currency && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.currency.message}
                </p>
              )}
            </div>

            {/* Account Number Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Account Number
              </label>
              <div className="relative">
                <input
                  {...register("account_number", {
                    required: "Account Number is required!",
                  })}
                  placeholder="Generated automatically"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 font-mono"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <FaUniversity className="text-gray-400" size={16} />
                </div>
              </div>
              {errors.account_number && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.account_number.message}
                </p>
              )}
            </div>

            {/* Initial Amount Input */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Initial Deposit ({currentCurrency})
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
                  min="0"
                  placeholder="0.00"
                  {...register("amount", {
                    required: "Initial amount is required!",
                    min: {
                      value: 0,
                      message: "Amount cannot be negative"
                    }
                  })}
                  className="w-full py-3 pr-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                  style={{ 
                    paddingLeft: `${Math.max(currencySymbol.length * 14 + 24, 60)}px`
                  }}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* Account Summary Card */}
            {selectedAccount && watchedAmount && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-violet-100 dark:border-slate-600">
                <div className="flex items-center gap-3 mb-2">
                  <MdVerifiedUser className="text-violet-500" size={20} />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Account Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{selectedAccount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{currentCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Initial Balance:</span>
                    <span className="font-medium text-violet-600 dark:text-violet-400">
                      {currencySymbol}{parseFloat(watchedAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                disabled={loading || typesLoading || currenciesLoading || !selectedAccount || isAccountExists(selectedAccount)}
                type="submit"
                className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <BiLoader className="text-xl animate-spin" />
                ) : (
                  <>
                    <BiPlus size={18} />
                    Create Account
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

export default AddAccount;