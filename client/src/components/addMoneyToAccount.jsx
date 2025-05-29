import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog } from '@headlessui/react';
import { toast } from 'sonner';
import api from '../libs/apiCalls';
import { formatCurrency } from '../libs';
import DialogWrapper from './wrappers/dialog-wrapper';
import Input from './ui/input';
import { Button } from './ui/button';
import { BiLoader } from 'react-icons/bi';

const AddMoney = ({ isOpen, setIsOpen, id, refetch }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const [loading, setLoading] = useState(false);

  const submitHandler = async (data) => {
    try {
      setLoading(true);
      const { data: res } = await api.put(`/accounts/add-money/${id}`, data);
      
      // Show success toast and close modal
      toast.success(res.message || 'Money added successfully!');
      setIsOpen(false);
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
  }

  return (
    <DialogWrapper isOpen={isOpen} closeModal={closeModal}>
      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left align-middle shadow-xl transition-all">
        <Dialog.Title
          as="h3"
          className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-300 mb-4 uppercase"
        >
          Add Money to Account
        </Dialog.Title>
        
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <Input
            type="number"
            name="amount"
            label="Amount"
            placeholder="10.56"
            {...register("amount", {
              required: "Amount is required!",
            })}
            error={errors.amount ? errors.amount.message : ""}
            className="inputStyle dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600"
          />

          <div className="w-full mt-8">
            <Button
              disabled={loading}
              type="submit"
              className="bg-violet-700 hover:bg-violet-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white w-full transition-colors"
            >
              {loading ? (
                <BiLoader className="text-xl animate-spin text-white" />
              ) : (
                `Add ${watch("amount") ? formatCurrency(watch("amount")) : ""}`
              )}
            </Button>
          </div>
        </form>
      </Dialog.Panel>
    </DialogWrapper>
  );
};

export default AddMoney;
