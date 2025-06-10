import React from 'react';
import { Trash2, Edit, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

const BudgetCard = ({ budget, onEdit, onDelete, onViewDetails }) => {
  const percentageUsed = parseFloat(budget.percentage_used || 0);
  const totalSpent = parseFloat(budget.total_spent || 0);
  const budgetAmount = parseFloat(budget.budget_amount || 0);
  const remaining = budgetAmount - totalSpent;

  const getStatusColor = () => {
    if (percentageUsed >= 100) return 'text-red-600 bg-red-50';
    if (percentageUsed >= (budget.alert_threshold_percentage || 80)) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getProgressColor = () => {
    if (percentageUsed >= 100) return 'bg-red-500';
    if (percentageUsed >= (budget.alert_threshold_percentage || 80)) return 'bg-yellow-500';
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

  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {budget.budget_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {budget.category} • {budget.period_type}
          </p>
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

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">Progress</span>
          <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor()}`}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
          <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center">
          <Calendar size={14} className="mr-1" />
          {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
        </div>
        <div className="flex items-center">
          <TrendingUp size={14} className="mr-1" />
          {formatCurrency(budgetAmount)}
        </div>
      </div>

      {budget.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 italic">
          {budget.description}
        </p>
      )}

      <button
        onClick={() => onViewDetails(budget)}
        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        View Details
      </button>
    </div>
  );
};

export default BudgetCard;
