import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, TrendingUp, AlertTriangle, DollarSign, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { budgetAPI } from '../libs/apiCalls';
import BudgetCard from '../components/BudgetCard';
import BudgetForm from '../components/BudgetForm';

const BudgetPage = () => {
  const { user } = useStore(state => state);
  const [budgets, setBudgets] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (user?.id) {
      fetchBudgets();
      fetchOverview();
    }
  }, [user?.id]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getUserBudgets(user.id);
      setBudgets(response.data.data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to fetch budgets');
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const response = await budgetAPI.getBudgetOverview(user.id);
      setOverview(response.data.data || null);
    } catch (error) {
      console.error('Error fetching budget overview:', error);
    }
  };

  const handleCreateBudget = async (budgetData) => {
    try {
      setFormLoading(true);
      const payload = {
        ...budgetData,
        user_id: user.id,
        budget_amount: parseFloat(budgetData.budget_amount),
        alert_threshold_percentage: parseInt(budgetData.alert_threshold_percentage)
      };

      await budgetAPI.createBudget(payload);
      toast.success('Budget created successfully');
      setIsFormOpen(false);
      fetchBudgets();
      fetchOverview();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error(error.response?.data?.message || 'Failed to create budget');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateBudget = async (budgetData) => {
    try {
      setFormLoading(true);
      const payload = {
        ...budgetData,
        budget_amount: parseFloat(budgetData.budget_amount),
        alert_threshold_percentage: parseInt(budgetData.alert_threshold_percentage)
      };

      await budgetAPI.updateBudget(user.id, editingBudget.id, payload);
      toast.success('Budget updated successfully');
      setIsFormOpen(false);
      setEditingBudget(null);
      fetchBudgets();
      fetchOverview();
    } catch (error) {
      console.error('Error updating budget:', error);
      toast.error(error.response?.data?.message || 'Failed to update budget');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await budgetAPI.deleteBudget(user.id, budgetId);
      toast.success('Budget deleted successfully');
      fetchBudgets();
      fetchOverview();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
  };

  const handleViewDetails = async (budget) => {
    try {
      const response = await budgetAPI.getBudgetSpending(user.id, budget.id);
      const spendingData = response.data.data;
      
      // Show detailed spending information
      toast.info(`Budget: ${budget.budget_name}\nSpent: ${spendingData.total_spent || 0}\nRemaining: ${spendingData.remaining || 0}`);
    } catch (error) {
      console.error('Error fetching budget details:', error);
      toast.error('Failed to fetch budget details');
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.budget_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         budget.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'exceeded') return matchesSearch && parseFloat(budget.percentage_used || 0) >= 100;
    if (filterStatus === 'warning') {
      const percentage = parseFloat(budget.percentage_used || 0);
      const threshold = budget.alert_threshold_percentage || 80;
      return matchesSearch && percentage >= threshold && percentage < 100;
    }
    if (filterStatus === 'healthy') return matchesSearch && parseFloat(budget.percentage_used || 0) < (budget.alert_threshold_percentage || 80);
    
    return matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage your spending budgets</p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Create Budget
        </button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Budgets</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{overview.totalBudgets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget Amount</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(overview.totalBudgetAmount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(overview.totalSpent)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">Budgets Exceeded</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{overview.budgetsExceeded}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search budgets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="flex items-center">
          <Filter className="mr-2 text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Budgets</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="exceeded">Exceeded</option>
          </select>
        </div>
      </div>

      {/* Budget Cards */}
      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {budgets.length === 0 ? 'No budgets yet' : 'No budgets match your filters'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {budgets.length === 0 
              ? 'Create your first budget to start tracking your spending'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {budgets.length === 0 && (
            <button
              onClick={() => {
                setEditingBudget(null);
                setIsFormOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Budget
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
        budget={editingBudget}
        isLoading={formLoading}
      />
    </div>
  );
};

export default BudgetPage;
