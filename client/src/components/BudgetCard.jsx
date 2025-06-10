import React from 'react';
import { Trash2, Edit, AlertTriangle, TrendingUp, Calendar, Bell, Info, DollarSign } from 'lucide-react';

const BudgetCard = ({ budget, onEdit, onDelete, onViewDetails }) => {
  const percentageUsed = parseFloat(budget.percentage_used || 0);
  const totalSpent = parseFloat(budget.total_spent || 0);
  const budgetAmount = parseFloat(budget.budget_amount || 0);
  const remaining = budgetAmount - totalSpent;
  const alertThreshold = budget.alert_threshold_percentage || 80;

  const getStatusColor = () => {
    if (percentageUsed >= 100) return 'text-red-600 bg-red-50';
    if (percentageUsed >= alertThreshold) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressColor = () => {
    if (percentageUsed >= 100) return 'bg-red-500';
    if (percentageUsed >= alertThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: budget.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getAlertStatus = () => {
    if (percentageUsed >= 100) return { text: 'Exceeded', color: 'text-red-600' };
    if (percentageUsed >= alertThreshold) return { text: 'Warning', color: 'text-yellow-600' };
    return { text: 'Healthy', color: 'text-green-600' };
  };

  const alertStatus = getAlertStatus();

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Header with name and actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.budget_name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {budget.category}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {budget.period_type}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {budget.currency || 'USD'}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(budget)}
            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Budget Amount and Currency */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign size={18} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Budget Amount</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(budgetAmount)}
          </span>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Progress</span>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${alertStatus.color}`}>
              {alertStatus.text}
            </span>
            <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor()}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Spending Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Spent</p>
          <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className={`p-2 rounded ${remaining >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className={`text-xs font-medium ${remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {remaining >= 0 ? 'Remaining' : 'Over Budget'}
          </p>
          <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {formatCurrency(Math.abs(remaining))}
          </p>
        </div>
      </div>

      {/* Alert Threshold */}
      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell size={16} className="text-amber-600 mr-2" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Alert Threshold</span>
          </div>
          <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {alertThreshold}% ({formatCurrency(budgetAmount * alertThreshold / 100)})
          </span>
        </div>
      </div>

      {/* Period Dates */}
      <div className="mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar size={16} className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Period</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {budget.period_type} Budget
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {budget.description && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
          <div className="flex items-start">
            <Info size={16} className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {budget.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${getProgressColor()}`}></div>
            {percentageUsed >= 100 ? 'Over Budget' : 
             percentageUsed >= alertThreshold ? 'Approaching Limit' : 'On Track'}
          </div>
        </div>
        <div className="text-right">
          <div>Updated: {formatDate(budget.updated_at || budget.created_at)}</div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onViewDetails(budget)}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <TrendingUp size={16} className="mr-2" />
        View Detailed Analytics
      </button>
    </div>
  );
};

export default BudgetCard;
