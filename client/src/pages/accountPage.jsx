import React, { useState, useEffect } from 'react';
import { FaBtc, FaPaypal, FaCreditCard, FaBusinessTime, FaUniversity, FaChartLine, FaExchangeAlt } from 'react-icons/fa';
import { RiVisaLine, RiBankLine } from 'react-icons/ri';
import { GiCash } from 'react-icons/gi';
import { MdAdd, MdVerifiedUser, MdSavings, MdAccountBalance, MdTrendingUp } from 'react-icons/md';
import { SiMastercard } from 'react-icons/si';
import { AiOutlineBank } from "react-icons/ai";
import { BiTransfer, BiPlus } from 'react-icons/bi';
import { toast } from 'sonner';
import { useStore } from '../store';
import  api  from '../libs/apiCalls';
import { AccountCardShimmer } from '../components/ui/shimmer';
import Title from '../components/Title';
import { formatCurrency, maskAccountNumber } from '../libs/index';
import AddAccount from '../components/addAccount';
import AddMoney from '../components/addMoneyToAccount';
import TransferMoney from '../components/transferMoney';

const ICONS = {
  crypto: (
    <div className='w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <FaBtc size={28} />
    </div>
  ),
  "visa debit card": (
    <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <RiVisaLine size={28} />
    </div>
  ),
  cash: (
    <div className='w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <GiCash size={28} />
    </div>
  ),
  paypal: (
    <div className='w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <FaPaypal size={28} />
    </div>
  ),
  "savings account": (
    <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <MdSavings size={28} />
    </div>
  ),
  "checking account": (
    <div className='w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <RiBankLine size={28} />
    </div>
  ),
  "credit card": (
    <div className='w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <FaCreditCard size={28} />
    </div>
  ),
  mastercard: (
    <div className='w-14 h-14 bg-gradient-to-br from-red-400 to-red-500 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <SiMastercard size={28} />
    </div>
  ),
  investment: (
    <div className='w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <FaChartLine size={28} />
    </div>
  ),
  business: (
    <div className='w-14 h-14 bg-gradient-to-br from-slate-500 to-slate-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <FaBusinessTime size={28} />
    </div>
  ),
  // Default fallback icon
  default: (
    <div className='w-14 h-14 bg-gradient-to-br from-gray-500 to-gray-600 text-white flex items-center justify-center rounded-xl shadow-lg'>
      <AiOutlineBank size={28} />
    </div>
  ),
};

const AccountPage = () => {
  const { user } = useStore((state) => state);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenTopup, setIsOpenTopup] = useState(false);
  const [isOpenTransfer, setIsOpenTransfer] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = async () => {
    try {
      const { data: res } = await api.get("/accounts");
      setData(res?.accounts);
      
      // Update user's accounts list in store
      if (res?.accounts?.length > 0) {
        const accountNames = res.accounts.map(acc => acc.account_name);
        user.accounts = accountNames;
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message);
      if (error?.response?.data?.status === "auth_failed") {
        localStorage.removeItem("user");
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddMoney = (account) => {
    setSelectedAccount(account);
    setIsOpenTopup(true);
  };

  const handleTransferMoney = (account) => {
    setSelectedAccount(account);
    setIsOpenTransfer(true);
  };

  const handleGeneralTransfer = () => {
    if (data?.length > 0) {
      setSelectedAccount(data[0]); // Default to first account
      setIsOpenTransfer(true);
    } else {
      toast.error("Please add an account first to make transfers");
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAccounts();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full py-10">
        {/* Header shimmer */}
        <div className="flex items-center justify-between mb-10">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-56 rounded"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded"></div>
        </div>

        {/* Account cards shimmer */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 py-10 gap-6">
          <AccountCardShimmer />
          <AccountCardShimmer />
          <AccountCardShimmer />
          <AccountCardShimmer />
        </div>
      </div>
    );
  }
  console.log("User accounts wefwe:", selectedAccount);

  return (
    <>
      <div className="w-full py-10">
        <div className="flex items-center justify-between mb-8">
          <Title title="Account Overview" />
          <div className="flex items-center gap-3">
            <button
              onClick={handleGeneralTransfer}
              className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <BiTransfer size={20} />
              <span>Transfer</span>
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <BiPlus size={20} />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {(data?.length === 0  || data?.length === undefined) ? (
          <div className="w-full flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex items-center justify-center mb-6">
              <MdAccountBalance size={60} className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Accounts Found</h3>
            <p className="text-gray-500 dark:text-gray-500 text-center mb-6">Get started by creating your first account</p>
            <button
              onClick={() => setIsOpen(true)}
              className="py-3 px-6 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
            >
              <BiPlus size={20} />
              <span>Create Account</span>
            </button>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {data?.map((acc, index) => (
              <div
                key={index}
                className="group relative w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden"
              >
                {/* Card Header with Icon and Account Type */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {ICONS[acc?.type_name?.toLowerCase()] || ICONS.default}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {acc?.type_name}
                          </h3>
                          <MdVerifiedUser size={20} className="text-emerald-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {maskAccountNumber(acc?.account_number)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(acc?.account_balance, acc?.currency)}
                    </p>
                  </div>

                  {/* Account Creation Date */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Created {new Date(acc?.created_at).toLocaleDateString("en-US", {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="px-6 pb-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAddMoney(acc)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <BiPlus size={16} />
                      Add Money
                    </button>
                    <button
                      onClick={() => handleTransferMoney(acc)}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <BiTransfer size={16} />
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Hover Effect Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddAccount
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        refetch={fetchAccounts}
        key={new Date().getTime()}
      />

      <AddMoney
        isOpen={isOpenTopup}
        setIsOpen={setIsOpenTopup}
        id={selectedAccount?.id}
        selectedAccount={selectedAccount}
        refetch={fetchAccounts}
      />

      <TransferMoney
        isOpen={isOpenTransfer}
        setIsOpen={setIsOpenTransfer}
        id={selectedAccount?.id}
        refetch={fetchAccounts}
      />


    </>
  );
};

export default AccountPage;
