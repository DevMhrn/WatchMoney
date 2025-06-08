import express from 'express';
import BudgetController from '../controllers/budgetController.js';

const router = express.Router();

// Budget CRUD operations
router.post('/', BudgetController.createBudget);
router.get('/:userId', BudgetController.getUserBudgets);
router.get('/:userId/overview', BudgetController.getBudgetOverview);
router.get('/:userId/:budgetId', BudgetController.getBudgetById);
router.put('/:userId/:budgetId', BudgetController.updateBudget);
router.delete('/:userId/:budgetId', BudgetController.deleteBudget);

// Budget spending operations
router.get('/:userId/:budgetId/spending', BudgetController.getBudgetSpending);
router.post('/:userId/:budgetId/recalculate', BudgetController.recalculateBudgetSpending);

export default router;
