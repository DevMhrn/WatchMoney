import express from 'express';
import budgetRoutes from './budgetRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import alertRoutes from './alertRoutes.js';
import categoryRoutes from './categoryRoutes.js';

const router = express.Router();

// Mount route modules
router.use('/budgets', budgetRoutes);
router.use('/transactions', transactionRoutes);
router.use('/alerts', alertRoutes);
router.use('/categories', categoryRoutes);

// Root health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Budget Alert Service is running',
        service: 'budget-alert-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            budgets: '/api/budgets',
            transactions: '/api/transactions',
            alerts: '/api/alerts',
            categories: '/api/categories'
        }
    });
});

// Service info endpoint
router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'Budget Alert Service',
            description: 'Microservice for budget management and alerting',
            version: '1.0.0',
            features: [
                'Budget creation and management',
                'Real-time transaction processing',
                'Automated budget threshold alerts',
                'Email notifications',
                'Budget spending tracking'
            ],
            endpoints: {
                budgets: {
                    'POST /budgets': 'Create a new budget',
                    'GET /budgets/:userId': 'Get user budgets',
                    'GET /budgets/:userId/:budgetId': 'Get specific budget',
                    'PUT /budgets/:userId/:budgetId': 'Update budget',
                    'DELETE /budgets/:userId/:budgetId': 'Delete budget'
                },
                transactions: {
                    'POST /transactions': 'Process transaction and check budgets',
                    'POST /transactions/bulk': 'Process multiple transactions',
                    'POST /transactions/preview': 'Preview transaction impact',
                    'POST /transactions/test': 'Test transaction processing'
                },
                alerts: {
                    'GET /alerts/:userId': 'Get user alerts',
                    'POST /alerts/:userId/:budgetId/check': 'Trigger budget check',
                    'PUT /alerts/:userId/:alertId/read': 'Mark alert as read'
                },
                categories: {
                    'POST /categories': 'Create a new category',
                    'GET /categories/:userId': 'Get user categories',
                    'GET /categories/:userId/:categoryId': 'Get specific category',
                    'PUT /categories/:userId/:categoryId': 'Update category',
                    'DELETE /categories/:userId/:categoryId': 'Delete category'
                }
            }
        }
    });
});

export default router;
