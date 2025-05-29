import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { BiLoader } from "react-icons/bi";
import { MdOutlineWarning } from "react-icons/md";
import { Dialog } from "@headlessui/react";
import {useStore} from "../store";
import { generateAccountNumber } from "../libs";
import DialogWrapper from "./wrappers/dialog-wrapper";
import Input from "./ui/input";
import {Button} from "./ui/button";
import { toast } from 'sonner';
import api from '../libs/apiCalls';


const accounts = ["Cash", "Crypto", "Paypal", "Visa Debit Card", "Mastercard"];

export const AddAccount = ({ isOpen, setIsOpen, refetch }) => {
  const { user } = useStore((state) => state);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { account_number: generateAccountNumber() },
  });

  const [selectedAccount, setSelectedAccount] = useState(accounts[0]);
  const [loading, setLoading] = useState(false);

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
        account_name: selectedAccount,
        account_number: data.account_number,
        account_balance: data.amount
      };

      const { data: res } = await api.post('/accounts/create', newData);
      
      // Check for success and show toast
      toast.success(res.message || 'Account created successfully!');
      setIsOpen(false);  // Close modal on success
      await refetch();   // Refresh accounts list
      
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
              Select Account
            </p>
            <select
              onChange={handleAccountSelect}
              value={selectedAccount}
              className='bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded w-full py-2 px-3 dark:bg-slate-800'
            >
              {accounts.map((acc, index) => (
                <option
                  key={index}
                  value={acc}
                  className='w-full flex items-center justify-center dark:bg-slate-800 dark:text-gray-300'
                >
                  {acc}
                </option>
              ))}
            </select>

            {isAccountExists(selectedAccount) && (
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
            disabled={loading}
            type="submit"
            className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full mt-4 transition-colors"
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
