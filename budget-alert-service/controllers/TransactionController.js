import TransactionService from '../services/TransactionService.js';
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse 
} from '../utils/responseHelpers.js';
import { validateTransactionData } from '../utils/validators.js';

class TransactionController {

    /**
     * Process a single transaction and check budget thresholds
     * POST /transactions
     * 
     * This is the main endpoint that will be called by the main server
     * after every transaction to check budget limits
     */
    async processTransaction(req, res) {
        try {
            console.log('🔍 Received transaction request:', {
                body: req.body,
                headers: {
                    'content-type': req.headers['content-type'],
                    authorization: req.headers.authorization ? 'Present' : 'Missing'
                }
            });

            const validation = validateTransactionData(req.body);
            
            if (!validation.isValid) {
                console.error('❌ Transaction validation failed:', validation.errors);
                return res.status(400).json(
                    validationErrorResponse(validation.errors)
                );
            }

            console.log('✅ Transaction validation passed, processing...');
            const result = await TransactionService.processTransaction(validation.sanitizedData);

            // Log the transaction processing for monitoring
            console.log(`📊 Transaction processed for user ${validation.sanitizedData.user_id}:`, {
                amount: validation.sanitizedData.amount,
                budgetsChecked: result.budgetChecks?.length || 0,
                alertsSent: result.budgetChecks?.filter(bc => bc.alertSent).length || 0
            });

            res.json(
                successResponse(result, 'Transaction processed successfully')
            );

        } catch (error) {
            console.error('❌ Error processing transaction:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Process multiple transactions in bulk
     * POST /transactions/bulk
     */
    async processBulkTransactions(req, res) {
        try {
            const { transactions } = req.body;

            if (!Array.isArray(transactions) || transactions.length === 0) {
                return res.status(400).json(
                    validationErrorResponse(['transactions must be a non-empty array'])
                );
            }

            if (transactions.length > 100) {
                return res.status(400).json(
                    validationErrorResponse(['Maximum 100 transactions per bulk operation'])
                );
            }

            const result = await TransactionService.processBulkTransactions(transactions);

            res.json(
                successResponse(result, 'Bulk transactions processed successfully')
            );

        } catch (error) {
            console.error('❌ Error processing bulk transactions:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Preview transaction impact on budgets without processing
     * POST /transactions/preview
     */
    async previewTransactionImpact(req, res) {
        try {
            const validation = validateTransactionData(req.body);
            
            if (!validation.isValid) {
                return res.status(400).json(
                    validationErrorResponse(validation.errors)
                );
            }

            const impact = await TransactionService.previewTransactionImpact(validation.sanitizedData);

            res.json(
                successResponse(impact, 'Transaction impact preview generated')
            );

        } catch (error) {
            console.error('❌ Error previewing transaction impact:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Recalculate all budgets for a user
     * POST /transactions/recalculate/:userId
     */
    async recalculateUserBudgets(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json(
                    validationErrorResponse(['userId is required'])
                );
            }

            const result = await TransactionService.recalculateUserBudgets(userId);

            res.json(
                successResponse(result, 'User budgets recalculated successfully')
            );

        } catch (error) {
            console.error('❌ Error recalculating user budgets:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Test transaction processing endpoint
     * POST /transactions/test
     */
    async testTransaction(req, res) {
        try {
            const { 
                user_id, 
                category_id = null, 
                amount = 100 
            } = req.body;

            if (!user_id) {
                return res.status(400).json(
                    validationErrorResponse(['user_id is required for testing'])
                );
            }

            const result = await TransactionService.testTransaction(user_id, category_id, amount);

            res.json(
                successResponse(result, 'Test transaction processed successfully')
            );

        } catch (error) {
            console.error('❌ Error processing test transaction:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Health check endpoint specifically for transaction processing
     * GET /transactions/health
     */
    async healthCheck(req, res) {
        try {
            const healthStatus = {
                service: 'budget-alert-service',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                endpoints: {
                    processTransaction: '/transactions',
                    bulkProcess: '/transactions/bulk', 
                    preview: '/transactions/preview',
                    test: '/transactions/test',
                    recalculate: '/transactions/recalculate/:userId'
                }
            };

            res.json(
                successResponse(healthStatus, 'Transaction service is healthy')
            );

        } catch (error) {
            console.error('❌ Error in health check:', error);
            res.status(500).json(
                errorResponse('Service health check failed')
            );
        }
    }

    /**
     * Get service statistics
     * GET /transactions/stats
     */
    async getServiceStats(req, res) {
        try {
            // This would typically come from a monitoring service or database
            const stats = {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString()
            };

            res.json(
                successResponse(stats, 'Service statistics retrieved')
            );

        } catch (error) {
            console.error('❌ Error retrieving service stats:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }
}

export default new TransactionController();
