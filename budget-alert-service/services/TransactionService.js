import BudgetService from './BudgetService.js';
import AlertService from './AlertService.js';
import dayjs from 'dayjs';

class TransactionService {

    /**
     * Process a transaction and check budget thresholds
     * This is the main endpoint that will be called by the main server
     */
    async processTransaction(transactionData) {
        try {
            const {
                user_id,
                category_id, // This could be category name or ID
                amount,
                transaction_date = new Date(),
                transaction_type = 'expense',
                description = ''
            } = transactionData;
            console.log('🔍 Processing transaction:')
            console.log('Transaction Data:', {
                user_id,
                category_id,
                amount,
                transaction_type,
                description
            });


            // Validate required fields
            if (!user_id || !amount) {
                return {
                    success: false,
                    message: 'Missing required fields: user_id and amount are required',
                    budgetChecks: []
                };
            }

            // IMPORTANT: Only process expense transactions for budget checking
            // Income and transfer transactions don't affect budget spending
            if (transaction_type !== 'expense' || amount <= 0) {
                return {
                    success: true,
                    message: `Transaction type '${transaction_type}' does not affect budgets. Budget check skipped.`,
                    budgetChecks: [],
                    skipped: true,
                    reason: `Only expense transactions affect budget spending. Type received: ${transaction_type}`
                };
            }

            console.log(`🔍 Processing EXPENSE transaction: ${amount} for user ${user_id}, category ${category_id}`);

            // Get all budgets that might be affected by this expense transaction
            const affectedBudgets = await BudgetService.getAffectedBudgets(
                user_id, 
                category_id, // Pass category name or ID
                transaction_date
            );

            if (affectedBudgets.length === 0) {
                console.log('ℹ️  No budgets affected by this expense transaction');
                return {
                    success: true,
                    message: 'Expense transaction processed (no matching budgets found)',
                    budgetChecks: []
                };
            }

            const budgetChecks = [];

            // Process EACH affected budget - handles multiple budgets per category
            for (const budget of affectedBudgets) {
                try {
                    console.log(`📊 Checking budget: ${budget.budget_name} (${budget.id})`);
                    
                    // Update budget spending with the converted transaction amount
                    await BudgetService.updateBudgetSpending(budget.id, user_id, amount);
                    
                    // Check for alerts
                    const alertResult = await AlertService.checkAndSendAlerts(user_id, budget.id);
                    
                    budgetChecks.push({
                        budgetId: budget.id,
                        budgetName: budget.budget_name,
                        alertSent: alertResult.success && alertResult.alert,
                        alertType: alertResult.alert?.alert_type || null,
                        alertMessage: alertResult.message
                    });
                    
                } catch (budgetError) {
                    console.error(`❌ Error processing budget ${budget.id}:`, budgetError.message);
                    budgetChecks.push({
                        budgetId: budget.id,
                        budgetName: budget.budget_name,
                        alertSent: false,
                        error: budgetError.message
                    });
                }
            }

            const successfulChecks = budgetChecks.filter(bc => !bc.error).length;
            const alertsSent = budgetChecks.filter(bc => bc.alertSent).length;

            return {
                success: true,
                message: `Expense transaction processed successfully. ${successfulChecks} budget(s) checked, ${alertsSent} alert(s) sent.`,
                budgetChecks,
                summary: {
                    budgetsChecked: successfulChecks,
                    alertsSent,
                    totalBudgets: affectedBudgets.length,
                    transactionType: transaction_type
                }
            };

        } catch (error) {
            console.error('❌ Error processing transaction:', error.message);
            return {
                success: false,
                message: `Transaction processing failed: ${error.message}`,
                budgetChecks: []
            };
        }
    }

    /**
     * Bulk process multiple transactions (useful for batch operations)
     */
    async processBulkTransactions(transactions) {
        const results = [];
        
        for (const transaction of transactions) {
            try {
                const result = await this.processTransaction(transaction);
                results.push({
                    success: true,
                    transaction,
                    result
                });
            } catch (error) {
                results.push({
                    success: false,
                    transaction,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            processedCount: results.length,
            successCount: results.filter(r => r.success).length,
            errorCount: results.filter(r => !r.success).length,
            results
        };
    }

    /**
     * Get transaction impact on budgets (preview without processing)
     */
    async previewTransactionImpact(transactionData) {
        try {
            const {
                user_id,
                category_id,
                amount,
                transaction_date = new Date(),
                transaction_type = 'expense'
            } = transactionData;

            if (transaction_type !== 'expense' || amount <= 0) {
                return {
                    budgets: [],
                    message: 'No budget impact for this transaction type'
                };
            }

            // Get affected budgets
            const affectedBudgets = await BudgetService.getAffectedBudgets(
                user_id, 
                category_id, 
                transaction_date
            );

            const budgetImpacts = [];

            for (const budget of affectedBudgets) {
                // Calculate current spending
                const currentSpending = await BudgetService.calculateBudgetSpending(budget.id, user_id);
                const currentSpent = currentSpending.total_spent || 0;
                const newTotal = currentSpent + parseFloat(amount);
                const newPercentage = budget.budget_amount > 0 ? 
                    Math.round((newTotal / budget.budget_amount) * 100 * 100) / 100 : 0;

                // Determine what alerts would be triggered
                const warningThreshold = budget.alert_threshold_percentage || 80;
                const criticalThreshold = 100;

                let wouldTriggerAlert = null;
                if (newPercentage >= criticalThreshold) {
                    wouldTriggerAlert = 'exceeded';
                } else if (newPercentage >= warningThreshold) {
                    wouldTriggerAlert = 'warning';
                }

                budgetImpacts.push({
                    budgetId: budget.id,
                    budgetName: budget.budget_name,
                    budgetAmount: budget.budget_amount,
                    currentSpent,
                    transactionAmount: parseFloat(amount),
                    newTotal,
                    currentPercentage: budget.budget_amount > 0 ? 
                        Math.round((currentSpent / budget.budget_amount) * 100 * 100) / 100 : 0,
                    newPercentage,
                    wouldTriggerAlert,
                    currency: budget.currency
                });
            }

            return {
                budgets: budgetImpacts,
                totalBudgetsAffected: budgetImpacts.length,
                alertsWouldTrigger: budgetImpacts.filter(b => b.wouldTriggerAlert).length
            };

        } catch (error) {
            console.error('❌ Error previewing transaction impact:', error.message);
            throw error;
        }
    }

    /**
     * Recalculate all budget spending for a user (maintenance function)
     */
    async recalculateUserBudgets(userId) {
        try {
            const userBudgets = await BudgetService.getUserBudgets(userId);
            const results = [];

            for (const budget of userBudgets) {
                try {
                    await BudgetService.updateBudgetSpending(budget.id, userId);
                    results.push({
                        budgetId: budget.id,
                        budgetName: budget.budget_name,
                        success: true
                    });
                } catch (error) {
                    results.push({
                        budgetId: budget.id,
                        budgetName: budget.budget_name,
                        success: false,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                processedBudgets: results.length,
                successCount: results.filter(r => r.success).length,
                results
            };

        } catch (error) {
            console.error('❌ Error recalculating user budgets:', error.message);
            throw error;
        }
    }

    /**
     * Test the transaction processing system
     */
    async testTransaction(userId, categoryId = null, amount = 100) {
        try {
            console.log(`🧪 Testing transaction processing for user ${userId}`);
            
            const testTransaction = {
                user_id: userId,
                category_id: categoryId,
                amount: amount,
                transaction_type: 'expense',
                description: 'Test transaction for budget alert system'
            };

            const result = await this.processTransaction(testTransaction);
            
            console.log('🧪 Test transaction result:', JSON.stringify(result, null, 2));
            
            return result;

        } catch (error) {
            console.error('❌ Test transaction failed:', error.message);
            throw error;
        }
    }
}

export default new TransactionService();
