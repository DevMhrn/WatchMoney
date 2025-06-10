import express from 'express';
import TransactionController from '../controllers/TransactionController.js';

const router = express.Router();

// Main transaction processing endpoint (called by main server)
router.post('/', TransactionController.processTransaction);

// Bulk processing
router.post('/bulk', TransactionController.processBulkTransactions);

// Preview transaction impact
router.post('/preview', TransactionController.previewTransactionImpact);

// Maintenance and testing
router.post('/recalculate/:userId', TransactionController.recalculateUserBudgets);
router.post('/test', TransactionController.testTransaction);

// Service health and stats
router.get('/health', TransactionController.healthCheck);
router.get('/stats', TransactionController.getServiceStats);

export default router;
