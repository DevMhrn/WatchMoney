import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MdOutlineWarning } from "react-icons/md";
import { BiLoader } from "react-icons/bi";
import { toast } from "sonner";
import { formatCurrency } from "../libs";
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
  const [selectedAccount, setSelectedAccount] = useState(""); // Track selected account

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
        toast.success(res?.message);
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
    setSelectedAccount(""); // Reset selected account
  }

  // Handle account selection change
  const handleAccountChange = (e) => {
    const value = e.target.value;
    setSelectedAccount(value);
    getAccountBalance(value);
  };

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase"
        >
          Add Transaction
        </Dialog.Title>

        {isLoading ? (
          <Loading />
        ) : (
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
            <div className="flex flex-col gap-1 mb-2">
              <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
                Select Account
              </p>
              <select
                value={selectedAccount} // Use value prop for controlled component
                onChange={handleAccountChange}
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
                    {acc?.type_name} {" - "}
                    {formatCurrency(acc?.account_balance)}
                  </option>
                ))}
              </select>
            </div>

            {accountBalance <= 0 && accountInfo.id && (
              <div className="flex items-center gap-2 bg-yellow-400/10 dark:bg-yellow-400/20 border border-yellow-500 text-yellow-700 dark:text-yellow-500 p-2 mt-6 rounded">
                <MdOutlineWarning size={30} />
                <span className="text-sm">
                  You cannot make transaction from this account. Insufficient account balance.
                </span>
              </div>
            )}

            {accountBalance > 0 && (
              <>
                <Input
                  name="description"
                  label="Description"
                  placeholder="Grocery Store"
                  {...register("description", {
                    required: "Transaction description is required!",
                  })}
                  error={errors.description ? errors.description.message : ""}
                  className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
                />

                <Input
                  type="number"
                  name="amount"
                  label="Amount"
                  placeholder="10.56"
                  {...register("amount", {
                    required: "Transaction amount is required!",
                    min: {
                      value: 0.01,
                      message: "Amount must be greater than 0"
                    },
                    max: {
                      value: accountBalance,
                      message: `Amount cannot exceed ${formatCurrency(accountBalance)}`
                    }
                  })}
                  error={errors.amount ? errors.amount.message : ""}
                  className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
                />

                {isAmountExceeding && (
                  <div className='flex items-center gap-2 bg-yellow-400/10 dark:bg-yellow-400/20 border border-yellow-500 text-yellow-700 dark:text-yellow-500 p-2 mt-6 rounded'>
                    <MdOutlineWarning size={30} />
                    <span className='text-sm'>
                      Transaction amount exceeds available balance of {formatCurrency(accountBalance)}
                    </span>
                  </div>
                )}

                <div className="w-full mt-8">
                  <Button
                    disabled={loading || isAmountExceeding} // Disable if loading or amount exceeds balance
                    type="submit"
                    className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full transition-colors"
                  >
                    {loading ? (
                      <BiLoader className="text-xl animate-spin text-white" />
                    ) : (
                      `Confirm ${watch("amount") ? formatCurrency(watch("amount")) : ""}`
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

export default AddTransaction;