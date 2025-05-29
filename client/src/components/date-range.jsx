import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDateSevenDaysAgo } from "../libs";

const DateRange = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sevenDaysAgo = getDateSevenDaysAgo();

  // Initialize dateFrom with URL param or default to 7 days ago
  const [dateFrom, setDateFrom] = useState(() => {
    const df = searchParams.get("df");
    return df && new Date(df).getTime() <= new Date().getTime()
      ? df
      : sevenDaysAgo || new Date().toISOString().split("T")[0];
  });

  // Initialize dateTo with URL param or default to today
  const [dateTo, setDateTo] = useState(() => {
    const dt = searchParams.get("dt");
    return dt && new Date(dt).getTime() >= new Date(dateFrom).getTime()
      ? dt
      : new Date().toISOString().split("T")[0];
  });

  // Update URL params when dates change
  useEffect(() => {
    setSearchParams({ df: dateFrom, dt: dateTo });
  }, [dateFrom, dateTo, setSearchParams]);

  // Handle date from change
  const handleDateFromChange = (e) => {
    const df = e.target.value;
    setDateFrom(df);
    // If selected 'from' date is after 'to' date, update 'to' date
    if (new Date(df).getTime() > new Date(dateTo).getTime()) {
      setDateTo(df);
    }
  };

  // Handle date to change
  const handleDateToChange = (e) => {
    const dt = e.target.value;
    setDateTo(dt);
    // If selected 'to' date is before 'from' date, update 'from' date
    if (new Date(dt).getTime() < new Date(dateFrom).getTime()) {
      setDateFrom(dt);
    }
  };

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-1'>
        <label
          htmlFor='dateFrom'
          className='block text-gray-700 dark:text-gray-400 text-sm mb-2'
        >
          Filter
        </label>
        <input
          className='inputStyles bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded py-1 px-2 dark:bg-slate-800'
          name='dateFrom'
          type='date'
          max={dateTo}
          value={dateFrom}
          onChange={handleDateFromChange}
        />
      </div>

      <div className='flex items-center gap-1'>
        <label
          htmlFor='dateTo'
          className='block text-gray-700 dark:text-gray-400 text-sm mb-2'
        >
          To
        </label>
        <input
          className='inputStyles bg-transparent appearance-none border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 outline-none focus:ring-1 ring-violet-500 dark:ring-violet-400 rounded py-1 px-2 dark:bg-slate-800'
          name='dateTo'
          type='date'
          min={dateFrom}
          value={dateTo}
          onChange={handleDateToChange}
        />
      </div>
    </div>
  );
};

export default DateRange;
