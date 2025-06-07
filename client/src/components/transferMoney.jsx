import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineWarning } from "react-icons/md";
import { BiLoader } from "react-icons/bi";
import { toast } from "sonner";
import DialogWrapper from "./wrappers/dialog-wrapper";
import { formatCurrency } from "../libs";
import api from "../libs/apiCalls";
import Loading from "./loading";
import Input from "./ui/input";
import { Button } from "./ui/button";
import { useStore } from "../store";
import currencyService from '../services/currencyService';

const TransferMoney = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountData, setAccountData] = useState([]);
  const [fromAccountInfo, setFromAccountInfo] = useState({});
  const [toAccountInfo, setToAccountInfo] = useState({});
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [convertedAmount, setConvertedAmount] = useState(null);

  // Use state to track selected values
  const [selectedFromAccount, setSelectedFromAccount] = useState("");
  const [selectedToAccount, setSelectedToAccount] = useState("");

  // Add amount watch
  const watchAmount = watch("amount");
  // Fix the balance check - compare converted amount with account balance
  const isAmountExceeding = watchAmount && convertedAmount && fromAccountInfo.account_balance && 
    convertedAmount > fromAccountInfo.account_balance;

  const getAccountBalance = (setAccount, val) => {
    const filteredAccount = accountData?.find(
      (account) => account.type_name === val
    );
    setAccount(filteredAccount || {});
  };

  // Fetch supported currencies
  const fetchSupportedCurrencies = async () => {
    try {
      const supportedCurrencies = await currencyService.getSupportedCurrencies();
      setCurrencies(supportedCurrencies || []);
    } catch (error) {
      console.error('Failed to load currencies:', error);
      setCurrencies(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']);
    }
  };

  // Calculate exchange rate when currencies change
  const calculateExchangeRate = async () => {
    if (fromAccountInfo.currency && selectedCurrency && fromAccountInfo.currency !== selectedCurrency) {
      try {
        const rate = await currencyService.getExchangeRates(selectedCurrency, fromAccountInfo.currency);
        setExchangeRate(rate.data.rate);
      } catch (error) {
        console.error('Failed to get exchange rate:', error);
        setExchangeRate(1);
      }
    } else {
      setExchangeRate(1);
    }
  };

  const submitHandler = async (data) => {
    try {
      setLoading(true);
      const newData = {
        ...data,
        from_account: fromAccountInfo.id,
        to_account: toAccountInfo.id,
        transfer_currency: selectedCurrency,
        exchange_rate: exchangeRate,
        converted_amount: convertedAmount
      };

      const { data: res } = await api.put('/transactions/transfer-money', newData);
      
      // Show success toast
      toast.success(res?.message || 'Transfer completed successfully!');
      
      // Close modal and reset form
      closeModal();
      
      // Refresh accounts list
      await refetch();
      
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const { data: res } = await api.get("/accounts");
      setAccountData(res?.accounts);
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to fetch accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchSupportedCurrencies();
  }, []);

  useEffect(() => {
    if (fromAccountInfo.currency) {
      setSelectedCurrency(fromAccountInfo.currency);
    }
  }, [fromAccountInfo]);

  useEffect(() => {
    calculateExchangeRate();
  }, [fromAccountInfo.currency, selectedCurrency]);

  // Update converted amount when amount or exchange rate changes
  useEffect(() => {
    if (watchAmount && exchangeRate) {
      setConvertedAmount(parseFloat(watchAmount) * exchangeRate);
    } else {
      setConvertedAmount(null);
    }
  }, [watchAmount, exchangeRate]);

  function closeModal() {
    setIsOpen(false);
    // Reset form when closing the modal
    reset({
      amount: ''
    });
    setFromAccountInfo({});
    setToAccountInfo({});
    setSelectedFromAccount(""); // Reset selected values
    setSelectedToAccount("");
  }

  // Handle change for "From Account" select
  const handleFromAccountChange = (e) => {
    const value = e.target.value;
    setSelectedFromAccount(value);
    getAccountBalance(setFromAccountInfo, value);
    // Reset "To Account" when "From Account" changes
    setSelectedToAccount("");
    setToAccountInfo({});
  };

  // Handle change for "To Account" select
  const handleToAccountChange = (e) => {
    const value = e.target.value;
    setSelectedToAccount(value);
    getAccountBalance(setToAccountInfo, value);
  };

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase"
        >
          Transfer Money
        </Dialog.Title>

        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            {/* From Account Selection */}
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                From Account
              </p>
              <select
                value={selectedFromAccount}
                onChange={handleFromAccountChange}
                className="inputStyles bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded w-full py-2 px-3 dark:bg-slate-800"
              >
                <option value="" disabled className="dark:bg-slate-900">
                  Select Account
                </option>
                {accountData?.map((acc, index) => (
                  <option
                    key={index}
                    value={acc?.type_name}
                    className="dark:bg-slate-900"
                  >
                    {acc?.type_name} - {formatCurrency(acc?.account_balance, acc?.currency)} ({acc?.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Currency Selection (only show if from account is selected) */}
            {fromAccountInfo.id && (
              <div className="flex flex-col gap-1 mb-2">
                <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                  Transfer Currency
                </p>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="inputStyles bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded w-full py-2 px-3 dark:bg-slate-800"
                >
                  {currencies.map((currency, index) => (
                    <option
                      key={index}
                      value={currency}
                      className="dark:bg-slate-900"
                    >
                      {currency}
                    </option>
                  ))}
                </select>
                
                {/* Exchange Rate Info */}
                {fromAccountInfo.currency !== selectedCurrency && exchangeRate !== 1 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Exchange Rate: 1 {selectedCurrency} = {exchangeRate.toFixed(6)} {fromAccountInfo.currency}
                  </div>
                )}
              </div>
            )}

            {/* To Account Selection */}
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                To Account
              </p>
              <select
                value={selectedToAccount}
                onChange={handleToAccountChange}
                className="inputStyles bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded w-full py-2 px-3 dark:bg-slate-800"
                disabled={!fromAccountInfo.id}
              >
                <option value="" disabled className="dark:bg-slate-900">
                  Select Account
                </option>
                {accountData
                  ?.filter((acc) => acc.id !== fromAccountInfo.id)
                  .map((acc, index) => (
                    <option
                      key={index}
                      value={acc?.type_name}
                      className="dark:bg-slate-900"
                    >
                      {acc?.type_name} - {formatCurrency(acc?.account_balance, acc?.currency)} ({acc?.currency})
                    </option>
                  ))}
              </select>
            </div>

            {/* Warning Messages */}
            {fromAccountInfo?.account_balance <= 0 && (
              <div className="flex items-center gap-2 bg-yellow-400/10 dark:bg-yellow-400/20 border border-yellow-500 text-yellow-700 dark:text-yellow-500 p-2 mt-6 rounded">
                <MdOutlineWarning size={30} />
                <span className="text-sm">
                  You cannot transfer money from this account. Insufficient balance.
                </span>
              </div>
            )}

            {fromAccountInfo.account_balance > 0 && toAccountInfo.id && (
              <>
                <Input
                  type="number"
                  name="amount"
                  label={`Amount (${selectedCurrency})`}
                  placeholder="10.56"
                  {...register("amount", {
                    required: "Transaction amount is required!",
                    min: {
                      value: 1,
                      message: "Amount must be greater than 0"
                    }
                  })}
                  error={errors.amount ? errors.amount.message : ""}
                  className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
                />

                {/* Show converted amount if different currency */}
                {convertedAmount && fromAccountInfo.currency !== selectedCurrency && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Converting {formatCurrency(watchAmount, selectedCurrency)} to {formatCurrency(convertedAmount, fromAccountInfo.currency)} from your {fromAccountInfo.type_name} account
                    </p>
                  </div>
                )}

                {isAmountExceeding && (
                  <div className='flex items-center gap-2 bg-yellow-400/10 dark:bg-yellow-400/20 border border-yellow-500 text-yellow-700 dark:text-yellow-500 p-2 mt-6 rounded'>
                    <MdOutlineWarning size={30} />
                    <span className='text-sm'>
                      Transfer amount of {formatCurrency(convertedAmount, fromAccountInfo.currency)} exceeds available balance of {formatCurrency(fromAccountInfo.account_balance, fromAccountInfo.currency)}
                    </span>
                  </div>
                )}

                <div className="w-full mt-8">
                  <Button
                    disabled={loading}
                    type="submit"
                    className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full transition-colors"
                  >
                    {loading ? (
                      <BiLoader className="text-xl animate-spin text-white" />
                    ) : (
                      `Transfer ${watch("amount") ? formatCurrency(watch("amount"), selectedCurrency) : ""}`
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default TransferMoney;