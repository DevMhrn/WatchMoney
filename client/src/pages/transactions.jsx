import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { IoSearchOutline, IoCheckmarkDoneCircle, IoFilterOutline } from "react-icons/io5";
import { MdAdd, MdTrendingUp, MdTrendingDown, MdAccountBalance } from "react-icons/md";
import { CiExport } from "react-icons/ci";
import { RiProgress3Line } from "react-icons/ri";
import { TiWarning } from "react-icons/ti";
import { BiPlus, BiDownload, BiFilter } from "react-icons/bi";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { toast } from "sonner";
import api from "../libs/apiCalls";
import Title from "../components/Title";
import Loading from "../components/loading";
import ViewTransaction from "../components/viewTransaction";
import AddTransaction from "../components/addTransaction";
import { exportToExcel } from "react-json-to-excel";
import DateRange from '../components/date-range';
import { formatCurrency } from "../libs";
import { TableShimmer } from "../components/ui/shimmer";

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenView, setIsOpenView] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  // Ref for search input
  const searchInputRef = useRef(null);

  // Initialize search state from URL params
  const [search, setSearch] = useState(searchParams.get('s') || "");

  const startDate = searchParams.get("df") || "";
  const endDate = searchParams.get("dt") || "";

  // Calculate summary statistics
  const totalIncome = data?.filter(t => t.type === "income").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalExpenses = data?.filter(t => t.type === "expense").reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const netAmount = totalIncome - totalExpenses;

  const handleViewTransaction = (el) => {
    setSelected(el);
    setIsOpenView(true);
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      // Get current search term from state, not directly from URL (for debouncing)
      const currentSearchTerm = search; 
      const URL = `/transactions?df=${startDate}&dt=${endDate}&s=${currentSearchTerm}`;
      const { data: res } = await api.get(URL);

      if (res?.status) {
        setData(res.data || []);
        console.log('Transactions fetched:', res.data, 'with search term:', currentSearchTerm);
      } else {
        toast.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error?.response?.data?.message || "Something unexpected happened");
      if (error?.response?.data?.status === "auth_failed") {
        localStorage.removeItem("user");
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
      // Focus on search after loading (if search term exists)
      if (search && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  // Debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Debounced search handler
  const debouncedSearch = useCallback(debounce((searchTerm) => {
    // Update URL based on search term
    setSearchParams(prevSearchParams => {
        const newSearchParams = new URLSearchParams(prevSearchParams);
        if (searchTerm) {
            newSearchParams.set('s', searchTerm);
        } else {
            newSearchParams.delete('s'); // Remove 's' if search term is empty
        }
        return newSearchParams;
    }, { replace: true });
  }, 300), [setSearchParams]); // Include setSearchParams in dependency array

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value); // Trigger debounced search
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchParams]);

  // Set initial focus to search bar
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Clear search and reload when search term is empty
  useEffect(() => {
    if (!search) {
      setSearchParams(prevSearchParams => {
        const newSearchParams = new URLSearchParams(prevSearchParams);
        newSearchParams.delete('s');
        return newSearchParams;
      });
    }
  }, [search, setSearchParams]);

  if (isLoading) {
    return (
      <div className="w-full py-10">
        {/* Enhanced header shimmer */}
        <div className="mb-8">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-64 rounded mb-6"></div>

          {/* Controls shimmer */}
          <div className='flex flex-col md:flex-row md:items-center justify-between mb-6'>
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-48 rounded"></div>
            <div className='flex flex-col md:flex-row md:items-center gap-4'>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-64 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 w-24 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Table shimmer */}
        <TableShimmer rows={8} columns={6} />
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-10">
        {/* Header */}
        <div className="mb-8">
          <Title title='Transaction Activity' />
        </div>

        {/* Controls Section */}
        <div className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
            <div className="flex items-center gap-4">
              <DateRange />
              
              {/* Enhanced Search */}
              <div className='relative'>
                <div className='flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 min-w-[300px] focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-transparent transition-all duration-200'>
                  <IoSearchOutline className='text-xl text-gray-500 dark:text-gray-400' />
                  <input
                    ref={searchInputRef}
                    value={search}
                    onChange={handleSearchChange}
                    type='text'
                    placeholder='Search transactions...'
                    className='outline-none bg-transparent text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400 w-full font-medium'
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Add Transaction Button */}
              <button
                onClick={() => setIsOpen(true)}
                className='py-3 px-6 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium'
              >
                <BiPlus size={20} />
                <span>Add Transaction</span>
              </button>

              {/* Export Button */}
              <button
                onClick={() => {
                  const exportStartDate = startDate ? startDate : new Date().toLocaleDateString("en-CA");
                  const exportEndDate = endDate ? endDate : new Date().toLocaleDateString("en-CA");
                  exportToExcel(data, `Transactions ${exportStartDate}-${exportEndDate}`);
                  toast.success('Transactions exported successfully!');
                }}
                className='py-3 px-4 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 flex items-center gap-2 transition-all duration-200 font-medium border border-gray-200 dark:border-slate-600'
              >
                <BiDownload size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 ml-4">
            Monitor and manage your financial transactions
        </p>

        {/* Transactions Table */}
        <div className='bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 overflow-hidden'>
          {data?.length === 0 ? (
            <div className='w-full flex flex-col items-center justify-center py-16'>
              <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <HiOutlineCurrencyDollar size={40} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Transactions Found</h3>
              <p className="text-gray-500 dark:text-gray-500 text-center mb-6">
                {search ? `No transactions match "${search}"` : 'Start by adding your first transaction'}
              </p>
              {!search && (
                <button
                  onClick={() => setIsOpen(true)}
                  className='py-2.5 px-5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white flex items-center gap-2 transition-all duration-200 font-medium'
                >
                  <BiPlus size={18} />
                  Add Transaction
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-slate-700/50'>
                  <tr className='text-gray-700 dark:text-gray-300 text-left'>
                    <th className='py-4 px-6 font-semibold text-sm'>Date</th>
                    <th className='py-4 px-6 font-semibold text-sm'>Description</th>
                    <th className='py-4 px-6 font-semibold text-sm'>Status</th>
                    <th className='py-4 px-6 font-semibold text-sm'>Source</th>
                    <th className='py-4 px-6 font-semibold text-sm'>Amount</th>
                    <th className='py-4 px-6 font-semibold text-sm'>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {data?.map((item, index) => (
                    <tr
                      key={index}
                      className='hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150'
                    >
                      <td className='py-4 px-6'>
                        <div className="flex flex-col">
                          <p className='text-sm font-medium text-gray-900 dark:text-gray-300'>
                            {new Date(item.createdat).toLocaleDateString("en-US", {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className='text-xs text-gray-500 dark:text-gray-400'>
                            {new Date(item.createdat).toLocaleTimeString("en-US", {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </td>

                      <td className='py-4 px-6'>
                        <div className='max-w-xs'>
                          <p className='text-sm font-medium text-gray-900 dark:text-gray-300 line-clamp-2'>
                            {item.description}
                          </p>
                        </div>
                      </td>

                      <td className='py-4 px-6'>
                        <div className='flex items-center gap-2'>
                          {item.status === "Pending" && (
                            <>
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className='text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full'>
                                Pending
                              </span>
                            </>
                          )}
                          {item.status === "Completed" && (
                            <>
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className='text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full'>
                                Completed
                              </span>
                            </>
                          )}
                          {item.status === "Rejected" && (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className='text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full'>
                                Rejected
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className='py-4 px-6'>
                        <span className='text-sm text-gray-600 dark:text-gray-400 font-medium'>
                          {item.source}
                        </span>
                      </td>

                      <td className='py-4 px-6'>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            item.type === "income" 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : "text-red-600 dark:text-red-400"
                          }`}>
                            {item.type === "income" ? "+" : "-"}
                            {formatCurrency(item.amount, item.currency)}
                          </span>
                        </div>
                      </td>

                      <td className='py-4 px-6'>
                        <button
                          onClick={() => handleViewTransaction(item)}
                          className='text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium text-sm hover:underline transition-colors duration-150'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {data?.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {data.length} transaction{data.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* Modal components */}
      <ViewTransaction
        isOpen={isOpenView}
        setIsOpen={setIsOpenView}
        data={selected}
      />
      
      <AddTransaction
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        refetch={fetchTransactions}
        key={new Date().getTime()}
      />
    </>
  );
};

export default Transactions;