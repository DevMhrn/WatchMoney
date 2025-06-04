import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BiLoader } from "react-icons/bi";
import { MdOutlineWarning } from "react-icons/md";
import { Dialog } from "@headlessui/react";
import {useStore} from "../store";
import { generateAccountNumber } from "../libs";
import DialogWrapper from "./wrappers/dialog-wrapper";
import Input from "./ui/input";
import {Button} from "./ui/button";
import { Shimmer } from "./ui/shimmer";
import { toast } from 'sonner';
import api from '../libs/apiCalls';

export const AddAccount = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { account_number: generateAccountNumber() },
  });

  const [accountTypes, setAccountTypes] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      fetchAccountTypes();
    }
  }, [isOpen]);

  // Add this function to check if account exists
  const isAccountExists = (accountName) => {
    return user?.accounts?.some(
      acc => acc.toLowerCase() === accountName.toLowerCase()
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
        account_type_name: selectedAccount, // Changed from account_name
        account_number: data.account_number,
        account_balance: data.amount
      };

      const { data: res } = await api.post('/accounts/create', newData);
      
      toast.success(res.message || 'Account created successfully!');
      setIsOpen(false);
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
  }

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase"
        >
          Add Account
        </Dialog.Title>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className='flex flex-col gap-1 mb-2'>
            <p className='text-gray-700 dark:text-gray-300 text-sm mb-2'>
              Select Account Type
            </p>
            
            {typesLoading ? (
              <div className="space-y-2">
                <Shimmer className="h-10 w-full rounded border border-gray-300 dark:border-gray-600" />
                <div className="flex items-center gap-2 mt-2">
                  <Shimmer className="w-4 h-4 rounded" />
                  <Shimmer className="h-3 w-32 rounded" />
                </div>
              </div>
            ) : (
              <select
                onChange={handleAccountSelect}
                value={selectedAccount}
                className='bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded w-full py-2 px-3 dark:bg-slate-800'
              >
                <option value="" disabled className="dark:bg-slate-900">
                  Select Account Type
                </option>
                {accountTypes.map((accountType, index) => (
                  <option
                    key={index}
                    value={accountType.type_name}
                    className='w-full flex items-center justify-center dark:bg-slate-800 dark:text-gray-300'
                  >
                    {accountType.type_name}
                  </option>
                ))}
              </select>
            )}

            {selectedAccount && isAccountExists(selectedAccount) && (
              <div className='flex items-center gap-2 bg-yellow-400/10 dark:bg-yellow-400/20 border border-yellow-500 text-yellow-700 dark:text-yellow-500 p-2 mt-6 rounded'>
                <MdOutlineWarning size={30} />
                <span className='text-sm'>
                  This account has already been activated. Try another one. Thank you.
                </span>
              </div>
            )}
          </div>

          <Input
            name='account_number'
            label='Account Number'
            placeholder='3864736573648'
            {...register("account_number", {
              required: "Account Number is required!",
            })}
            error={errors.account_number ? errors.account_number.message : ""}
            className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
          />

          <Input
            type="number"
            name="amount"
            label="Initial Amount"
            placeholder="10.56"
            {...register("amount", {
              required: "Initial amount is required!",
            })}
            error={errors.amount ? errors.amount.message : ""}
            className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
          />

          <Button
            disabled={loading || typesLoading || !selectedAccount}
            type="submit"
            className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full mt-4 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <BiLoader className="text-xl animate-spin text-white" />
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default AddAccount;