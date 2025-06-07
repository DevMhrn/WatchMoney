import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineWarning, MdAccountBalance, MdPayment } from "react-icons/md";
import { BiLoader, BiPlus, BiWallet } from "react-icons/bi";
import { toast } from "sonner";
import { formatCurrency, getCurrencySymbol } from "../libs";
import api from "../libs/apiCalls";
import { useStore } from "../store";
import DialogWrapper from "./wrappers/dialog-wrapper";
import Input from "./ui/input";
import { Button } from "./ui/button";
import Loading from "./loading";

const AddTransaction = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const [accountBalance, setAccountBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [accountInfo, setAccountInfo] = useState({});
  const [selectedAccount, setSelectedAccount] = useState("");

  // Add amount validation check
  const watchAmount = watch("amount");
  const isAmountExceeding = watchAmount && accountBalance && Number(watchAmount) > accountBalance;

  const submitHandler = async (data) => {
    try {
      setLoading(true);
      const newData = { ...data, source: accountInfo.account_name };

      const { data: res } = await api.post(
        `/transactions/add-transaction/${accountInfo.id}`,
        newData
      );

      if (res?.status) {
        toast.success(res?.message || 'Transaction added successfully!');
        setIsOpen(false);
        await refetch();
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountBalance = (val) => {
    const filteredAccount = accountData?.find(
      (account) => account.type_name === val
    );
    setAccountBalance(filteredAccount ? filteredAccount.account_balance : 0);
    setAccountInfo(filteredAccount || {});
  };

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const { data: res } = await api.get("/accounts");
      setAccountData(res?.accounts || []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  function closeModal() {
    setIsOpen(false);
    reset();
    setAccountInfo({});
    setAccountBalance(0);
    setSelectedAccount("");
  }

  // Handle account selection change
  const handleAccountChange = (e) => {
    const value = e.target.value;
    setSelectedAccount(value);
    getAccountBalance(value);
  };

  const currencySymbol = getCurrencySymbol(accountInfo?.currency || 'USD');

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl transition-all border border-gray-100 dark:border-slate-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <MdPayment size={24} />
            </div>
            <div>
              <Dialog.Title as="h3" className="text-xl font-bold">
                Add Transaction
              </Dialog.Title>
              <p className="text-green-100 text-sm">
                Record a new expense or payment
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <Loading />
          ) : (
            <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
              {/* Account Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select Account
                </label>
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={handleAccountChange}
                    className="w-full appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose an account
                    </option>
                    {accountData?.map((acc, index) => (
                      <option
                        key={index}
                        value={acc?.type_name}
                        className="dark:bg-slate-800 dark:text-gray-300"
                      >
                        {acc?.type_name} - {formatCurrency(acc?.account_balance, acc?.currency)}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <BiWallet className="text-gray-400" size={20} />
                  </div>
                </div>
              </div>

              {/* Account Balance Info */}
              {accountInfo?.id && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-blue-100 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Balance</span>
                    <div className="flex items-center gap-2">
                      <MdAccountBalance className="text-blue-500" size={18} />
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(accountBalance, accountInfo?.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Low Balance Warning */}
              {accountBalance <= 0 && accountInfo.id && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-4 rounded-xl">
                  <MdOutlineWarning size={24} className="mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Insufficient Balance</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      This account has insufficient funds for transactions. Please add money first.
                    </p>
                  </div>
                </div>
              )}

              {accountBalance > 0 && (
                <>
                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Grocery shopping, Gas bill, Coffee"
                      {...register("description", {
                        required: "Transaction description is required!",
                      })}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Amount ({accountInfo?.currency || 'USD'})
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                          {currencySymbol}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        {...register("amount", {
                          required: "Transaction amount is required!",
                          min: {
                            value: 0.01,
                            message: "Amount must be greater than 0"
                          },
                          max: {
                            value: accountBalance,
                            message: `Amount cannot exceed ${formatCurrency(accountBalance, accountInfo?.currency)}`
                          }
                        })}
                        className="w-full py-3 pr-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
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

                  {/* Amount Exceeding Warning */}
                  {isAmountExceeding && (
                    <div className='flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-xl'>
                      <MdOutlineWarning size={24} className="mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Amount Exceeds Balance</p>
                        <p className="text-red-700 dark:text-red-300">
                          Transaction amount exceeds available balance of {formatCurrency(accountBalance, accountInfo?.currency)}
                        </p>
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
                      disabled={loading || isAmountExceeding}
                      type="submit"
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <BiLoader className="text-xl animate-spin" />
                      ) : (
                        <>
                          <BiPlus size={18} />
                          Confirm {watchAmount ? formatCurrency(watchAmount, accountInfo?.currency) : "Transaction"}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default AddTransaction;