import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import CurrencyService from '../services/currencyService';
import { budgetAPI } from '../libs/apiCalls';
import { useStore } from '../store';

const BudgetForm = ({ isOpen, onClose, onSubmit, budget = null, isLoading = false }) => {
  const { user } = useStore((state) => state);

  const [formData, setFormData] = useState({
    budget_name: '',
    category_id: '',
    budget_amount: '',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    alert_threshold_percentage: 80,
    description: '',
    currency: 'USD'
  });

  const [errors, setErrors] = useState({});
  const [currencies, setCurrencies] = useState(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR']);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  useEffect(() => {
    if (budget) {
      setFormData({
        budget_name: budget.budget_name || '',
        category_id: budget.category_id || '',
        budget_amount: budget.budget_amount || '',
        period_type: budget.period_type || 'monthly',
        start_date: budget.start_date ? budget.start_date.split('T')[0] : '',
        end_date: budget.end_date ? budget.end_date.split('T')[0] : '',
        alert_threshold_percentage: budget.alert_threshold_percentage || 80,
        description: budget.description || '',
        currency: budget.currency || 'USD'
      });
    } else {
      // Reset form for new budget
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      
      setFormData({
        budget_name: '',
        category_id: '',
        budget_amount: '',
        period_type: 'monthly',
        start_date: today.toISOString().split('T')[0],
        end_date: nextMonth.toISOString().split('T')[0],
        alert_threshold_percentage: 80,
        description: '',
        currency: 'USD'
      });
    }
    setErrors({});
  }, [budget, isOpen]);

  // Fetch supported currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      setLoadingCurrencies(true);
      try {
        const supportedCurrencies = await CurrencyService.getSupportedCurrencies();
        if (supportedCurrencies && supportedCurrencies.length > 0) {
          setCurrencies(supportedCurrencies);
        }
      } catch (error) {
        console.error('Failed to fetch currencies, using fallback:', error);
        // Keep fallback currencies
      } finally {
        setLoadingCurrencies(false);
      }
    };

    if (isOpen) {
      fetchCurrencies();
    }
  }, [isOpen]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        // Only fetch expense categories since budgets track expense spending
        const response = await budgetAPI.getCategories('expense');
        setCategories(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Fallback expense categories
        setCategories([
          { id: 'fallback-1', name: 'Food & Dining' },
          { id: 'fallback-2', name: 'Transportation' },
          { id: 'fallback-3', name: 'Shopping' },
          { id: 'fallback-4', name: 'Entertainment' },
          { id: 'fallback-5', name: 'Bills & Utilities' },
          { id: 'fallback-6', name: 'Other' }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const periodTypes = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.budget_name.trim()) {
      newErrors.budget_name = 'Budget name is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.budget_amount || parseFloat(formData.budget_amount) <= 0) {
      newErrors.budget_amount = 'Budget amount must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.alert_threshold_percentage < 1 || formData.alert_threshold_percentage > 100) {
      newErrors.alert_threshold_percentage = 'Alert threshold must be between 1 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check for conflicts when category or dates change
  useEffect(() => {
    const checkConflicts = async () => {
      if (formData.category_id && formData.start_date && formData.end_date && !budget && user?.id) {
        setCheckingConflicts(true);
        try {
          const response = await budgetAPI.checkBudgetConflicts({
            user_id: user.id,
            category_id: formData.category_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            budget_id: budget?.id
          });

          if (response.data.data.has_conflicts) {
            setConflicts(response.data.data.conflicts);
            setShowConflictWarning(true);
          } else {
            setConflicts([]);
            setShowConflictWarning(false);
          }
        } catch (error) {
          console.error('Error checking conflicts:', error);
          // Reset conflicts on error
          setConflicts([]);
          setShowConflictWarning(false);
        } finally {
          setCheckingConflicts(false);
        }
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.category_id, formData.start_date, formData.end_date, budget, user?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Include conflicts override if user confirmed
      const submitData = {
        ...formData,
        user_id: user?.id, // Add user_id to form data
        allow_overlapping: showConflictWarning && conflicts.length > 0 && window.confirm(
          `This budget will overlap with existing budgets:\n${conflicts.map(c => `• ${c.budget_name} (${c.start_date} to ${c.end_date})`).join('\n')}\n\nDo you want to create it anyway?`
        )
      };
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {budget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Name *
              </label>
              <input
                type="text"
                name="budget_name"
                value={formData.budget_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.budget_name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g., Monthly Food Budget"
              />
              {errors.budget_name && <p className="text-red-500 text-xs mt-1">{errors.budget_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                disabled={loadingCategories}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.category_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">
                  {loadingCategories ? 'Loading categories...' : 'Select Category'}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Amount *
              </label>
              <input
                type="number"
                name="budget_amount"
                value={formData.budget_amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.budget_amount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {errors.budget_amount && <p className="text-red-500 text-xs mt-1">{errors.budget_amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                disabled={loadingCurrencies}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                {loadingCurrencies ? (
                  <option value="">Loading currencies...</option>
                ) : (
                  currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period Type
              </label>
              <select
                name="period_type"
                value={formData.period_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {periodTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alert Threshold (%)
            </label>
            <input
              type="number"
              name="alert_threshold_percentage"
              value={formData.alert_threshold_percentage}
              onChange={handleChange}
              min="1"
              max="100"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.alert_threshold_percentage ? 'border-red-500' : 'border-gray-300'}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll be alerted when spending reaches this percentage of your budget
            </p>
            {errors.alert_threshold_percentage && <p className="text-red-500 text-xs mt-1">{errors.alert_threshold_percentage}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Optional description for this budget..."
            />
          </div>

          {/* Conflict Warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Budget Conflict Detected
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    <p>This budget overlaps with existing budgets for the same category:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {conflicts.map((conflict, index) => (
                        <li key={index}>
                          <strong>{conflict.budget_name}</strong> ({conflict.start_date} to {conflict.end_date})
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">
                      <strong>Note:</strong> Creating overlapping budgets may result in the same transactions being counted multiple times.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {checkingConflicts && (
            <div className="text-center text-sm text-gray-500">
              Checking for budget conflicts...
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : (budget ? 'Update Budget' : 'Create Budget')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetForm;
