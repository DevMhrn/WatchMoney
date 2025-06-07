import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { getDateSevenDaysAgo } from "../libs";

const DatePicker = ({ value, onChange, min, max, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return placeholder;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const isSelectedDate = (date) => {
    if (!date || !value) return false;
    return date.toISOString().split('T')[0] === value;
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    const dateStr = date.toISOString().split('T')[0];
    onChange({ target: { value: dateStr } });
    setIsOpen(false);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    const todayStr = today.toISOString().split('T')[0];
    onChange({ target: { value: todayStr } });
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange({ target: { value: '' } });
    setIsOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="relative" ref={datePickerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:border-violet-400 dark:hover:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 dark:focus-within:ring-violet-400 dark:focus-within:border-violet-400 transition-colors duration-200 min-w-[140px]"
      >
        <span className={value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
          {formatDisplayDate(value)}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[300px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth(currentMonth).map((date, index) => (
              <button
                key={index}
                onClick={() => date && handleDateClick(date)}
                disabled={!date || isDateDisabled(date)}
                className={`
                  p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150
                  ${!date ? 'invisible' : ''}
                  ${isSelectedDate(date) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                  ${isDateDisabled(date) ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed hover:bg-transparent' : 'text-gray-900 dark:text-gray-100'}
                  ${date && date.toDateString() === new Date().toDateString() && !isSelectedDate(date) ? 'font-bold text-blue-600 dark:text-blue-400' : ''}
                `}
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={clearDate}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear
            </button>
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
    <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
          Date Range:
        </span>
      </div>
      
      <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
            From
          </label>
          <DatePicker
            value={dateFrom}
            onChange={handleDateFromChange}
            max={dateTo}
            label="From"
            placeholder="Select start date"
          />
        </div>

        <div className='hidden sm:flex items-center px-2'>
          <span className='text-gray-400 dark:text-gray-500'>—</span>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
            To
          </label>
          <DatePicker
            value={dateTo}
            onChange={handleDateToChange}
            min={dateFrom}
            label="To"
            placeholder="Select end date"
          />
        </div>
      </div>
    </div>
  );
};

export default DateRange;
