import express from 'express';
import budgetController from '../controllers/BudgetController.js';

const router = express.Router();

// Create a new budget
router.post('/', budgetController.createBudget);

// Check for budget conflicts before creation
router.post('/check-conflicts', budgetController.checkBudgetConflicts);

// Get budget overview for a user
router.get('/:userId/overview', budgetController.getBudgetOverview);

// Get all budgets for a user
router.get('/:userId', budgetController.getUserBudgets);

// Get a specific budget
router.get('/:userId/:budgetId', budgetController.getBudgetById);

// Update a budget
router.put('/:userId/:budgetId', budgetController.updateBudget);

// Delete a budget
router.delete('/:userId/:budgetId', budgetController.deleteBudget);

// Get budget spending summary
router.get('/:userId/:budgetId/spending', budgetController.getBudgetSpending);

// Recalculate budget spending
router.post('/:userId/:budgetId/recalculate', budgetController.recalculateBudgetSpending);

export default router;
