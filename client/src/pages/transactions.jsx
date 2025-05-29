import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { IoSearchOutline, IoCheckmarkDoneCircle } from "react-icons/io5";
import { MdAdd } from "react-icons/md";
import { CiExport } from "react-icons/ci";
import { RiProgress3Line } from "react-icons/ri";
import { TiWarning } from "react-icons/ti";
import { toast } from "sonner";
import api from "../libs/apiCalls";
import Title from "../components/Title";
import Loading from "../components/loading";
import ViewTransaction from "../components/viewTransaction";
import AddTransaction from "../components/addTransaction";
import { exportToExcel } from "react-json-to-excel";
import DateRange from '../components/date-range';
import { formatCurrency } from "../libs";

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
      <div className="flex items-center justify-center w-full h-[80vh]">
        <Loading />
      </div>
    );
  }

  return (
    <>
      <div className="w-full py-10">
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-10'>
          <Title title='Transactions Activity' />
          <div className='flex flex-col md:flex-row md:items-center gap-4'>
            <DateRange />
            
            {/* Search Form */}
            <div className='w-full flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-2'>
              <IoSearchOutline className='text-xl text-gray-600 dark:text-gray-500' />
              <input
                ref={searchInputRef}
                value={search}
                onChange={handleSearchChange}
                type='text'
                placeholder='Search now...'
                className='outline-none bg-transparent text-gray-700 dark:text-gray-400 placeholder:text-gray-600 w-full'
              />
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className='py-1.5 px-2 rounded bg-black dark:bg-violet-800 text-white flex items-center justify-center gap-2'
            >
              <MdAdd size={22} />
              <span>Pay</span>
            </button>

            <button
              onClick={() => {
                const exportStartDate = startDate ? startDate : new Date().toLocaleDateString("en-CA");
                const exportEndDate = endDate ? endDate : new Date().toLocaleDateString("en-CA");
                exportToExcel(data, `Transactions ${exportStartDate}-${exportEndDate}`);
              }}
              className='flex items-center gap-2 text-black dark:text-gray-300'
            >
              Export <CiExport size={24} />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto mt-5'>
          {data?.length === 0 ? (
            <div className='w-full flex items-center justify-center py-10 text-gray-600 dark:text-gray-700 text-lg'>
              <span>No Transaction History</span>
            </div>
          ) : (
            <table className='w-full'>
              <thead className='w-full border-b border-gray-300 dark:border-gray-700'>
                <tr className='w-full text-black dark:text-gray-400 text-left'>
                  <th className='py-2'>Date</th>
                  <th className='py-2 px-2'>Description</th>
                  <th className='py-2 px-2'>Status</th>
                  <th className='py-2 px-2'>Source</th>
                  <th className='py-2 px-2'>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item, index) => (
                  <tr
                    key={index}
                    className='w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                  >
                    <td className='py-4'>
                      <p className='w-24 md:w-auto text-gray-600 dark:text-gray-400'>
                        {new Date(item.createdat).toDateString()}
                      </p>
                    </td>

                    <td className='py-4 px-2'>
                      <div className='flex flex-col w-56 md:w-auto'>
                        <p className='text-base 2xl:text-lg text-black dark:text-gray-400 line-clamp-2'>
                          {item.description}
                        </p>
                      </div>
                    </td>

                    <td className='py-4 px-2'>
                      <div className='flex items-center gap-2'>
                        {item.status === "Pending" && (
                          <RiProgress3Line className='text-amber-600' size={24} />
                        )}
                        {item.status === "Completed" && (
                          <IoCheckmarkDoneCircle className='text-emerald-600' size={24} />
                        )}
                        {item.status === "Rejected" && (
                          <TiWarning className='text-red-600' size={24} />
                        )}
                        <span className='text-gray-600 dark:text-gray-400'>
                          {item.status}
                        </span>
                      </div>
                    </td>

                    <td className='py-4 px-2 text-gray-600 dark:text-gray-400'>
                      {item.source}
                    </td>

                    <td className='py-4 px-2'>
                      <span className={`text-lg font-bold ${
                        item.type === "income" 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}>
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </span>
                    </td>

                    <td className='py-4 px-2'>
                      <button
                        onClick={() => handleViewTransaction(item)}
                        className='outline-none text-violet-600 dark:text-violet-400 hover:underline'
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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