import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { BiLoader, BiInfoCircle } from 'react-icons/bi'; // Added BiInfoCircle
import api from '../libs/apiCalls';
import Input from "./ui/input";
import { Button } from "./ui/button";

export const ChangePassword = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const submitPasswordHandler = async (data) => {
    try {
      setLoading(true);
      const payload = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword, 
        confirmPassword: data.confirmPassword
      };

      const { data: res } = await api.put('/users/change-password', payload);
    //   console.log('Response:', res);
      if (res?.status) {
        toast.success(res?.message || 'Password updated successfully');
        reset(); // Clear form after success
      }
    } catch (error) {
      console.error("Something went wrong:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 pt-10 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Change Password
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        <BiInfoCircle className="inline-block mr-1" />
        To change your password, please fill out the fields below.
      </p>

      <form onSubmit={handleSubmit(submitPasswordHandler)} className="space-y-6 max-w-xl">
        <Input
          type="password"
          label="Current Password"
          placeholder="Enter your current password"
          error={errors?.currentPassword?.message}
          {...register("currentPassword", {
            required: "Current password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters"
            }
          })}
          className="w-full text-sm border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-blue-500" 
        />

        <Input
          type="password"
          label="New Password"
          placeholder="Enter your new password"
          error={errors?.newPassword?.message}
          {...register("newPassword", {
            required: "New password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters"
            }
          })}
          className="w-full text-sm border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-blue-500" 
        />

        <Input
          type="password"
          label="Confirm New Password"
          placeholder="Confirm your new password"
          error={errors?.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Please confirm your new password",
            validate: (value) =>
              value === getValues("newPassword") || "Passwords do not match"
          })}
          className="w-full text-sm border dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus:border-blue-500"
        />

        <div className="mt-2">
          <ul className="text-sm text-gray-600 dark:text-gray-400">
            <li className="mb-1 flex items-center">
              <BiInfoCircle className="mr-1 text-blue-500" />
              Your password must be at least 6 characters long.
            </li>
            <li className="mb-1 flex items-center">
              <BiInfoCircle className="mr-1 text-blue-500" />
              We recommend using a combination of letters, numbers, and symbols for a stronger password.
            </li>
          </ul>
        </div>

        <div className="pt-6">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
          >
            {loading ? (
              <BiLoader className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;