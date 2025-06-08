import BudgetService from '../services/BudgetService.js';
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse, 
    notFoundResponse 
} from '../utils/responseHelpers.js';
import { 
    validateBudgetData, 
    validateBudgetUpdateData, 
    validatePagination 
} from '../utils/validators.js';
import { isValidUUID } from '../utils/formatters.js';

class BudgetController {

    /**
     * Create a new budget
     * POST /budgets
     */
    async createBudget(req, res) {
        try {
            const validation = validateBudgetData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json(
                    validationErrorResponse(validation.errors)
                );
            }

            const budget = await BudgetService.createBudget(validation.sanitizedData);

            res.status(201).json(
                successResponse(budget, 'Budget created successfully', 201)
            );

        } catch (error) {
            console.error('Error creating budget:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get all budgets for a user
     * GET /budgets/:userId
     */
    async getUserBudgets(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            const budgets = await BudgetService.getUserBudgets(userId);

            res.json(
                successResponse(budgets, 'Budgets retrieved successfully')
            );

        } catch (error) {
            console.error('Error fetching user budgets:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get a specific budget by ID
     * GET /budgets/:userId/:budgetId
     */
    async getBudgetById(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            const budget = await BudgetService.getBudgetById(budgetId, userId);

            if (!budget) {
                return res.status(404).json(
                    notFoundResponse('Budget')
                );
            }

            res.json(
                successResponse(budget, 'Budget retrieved successfully')
            );

        } catch (error) {
            console.error('Error fetching budget:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Update a budget
     * PUT /budgets/:userId/:budgetId
     */
    async updateBudget(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            const validation = validateBudgetUpdateData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json(
                    validationErrorResponse(validation.errors)
                );
            }

            const updatedBudget = await BudgetService.updateBudget(budgetId, userId, req.body);

            if (!updatedBudget) {
                return res.status(404).json(
                    notFoundResponse('Budget')
                );
            }

            res.json(
                successResponse(updatedBudget, 'Budget updated successfully')
            );

        } catch (error) {
            console.error('Error updating budget:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Delete a budget
     * DELETE /budgets/:userId/:budgetId
     */
    async deleteBudget(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            const success = await BudgetService.deleteBudget(budgetId, userId);

            if (!success) {
                return res.status(404).json(
                    notFoundResponse('Budget')
                );
            }

            res.json(
                successResponse(null, 'Budget deleted successfully')
            );

        } catch (error) {
            console.error('Error deleting budget:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get budget spending summary
     * GET /budgets/:userId/:budgetId/spending
     */
    async getBudgetSpending(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            const spending = await BudgetService.calculateBudgetSpending(budgetId, userId);

            res.json(
                successResponse(spending, 'Budget spending retrieved successfully')
            );

        } catch (error) {
            console.error('Error fetching budget spending:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Manually recalculate budget spending
     * POST /budgets/:userId/:budgetId/recalculate
     */
    async recalculateBudgetSpending(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            await BudgetService.updateBudgetSpending(budgetId, userId);

            res.json(
                successResponse(null, 'Budget spending recalculated successfully')
            );

        } catch (error) {
            console.error('Error recalculating budget spending:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get budget status overview for a user
     * GET /budgets/:userId/overview
     */
    async getBudgetOverview(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            const budgets = await BudgetService.getUserBudgets(userId);
            
            // Calculate overview statistics
            const overview = {
                totalBudgets: budgets.length,
                activeBudgets: budgets.filter(b => b.is_active).length,
                totalBudgetAmount: budgets.reduce((sum, b) => sum + parseFloat(b.budget_amount || 0), 0),
                totalSpent: budgets.reduce((sum, b) => sum + parseFloat(b.total_spent || 0), 0),
                budgetsExceeded: budgets.filter(b => parseFloat(b.percentage_used || 0) >= 100).length,
                budgetsInWarning: budgets.filter(b => {
                    const percentage = parseFloat(b.percentage_used || 0);
                    const threshold = b.alert_threshold_percentage || 80;
                    return percentage >= threshold && percentage < 100;
                }).length,
                budgetsByPeriod: budgets.reduce((acc, budget) => {
                    acc[budget.period_type] = (acc[budget.period_type] || 0) + 1;
                    return acc;
                }, {}),
                budgets: budgets
            };

            res.json(
                successResponse(overview, 'Budget overview retrieved successfully')
            );

        } catch (error) {
            console.error('Error fetching budget overview:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }
}

export default new BudgetController();
