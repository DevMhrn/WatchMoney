import express from 'express';
import AlertController from '../controllers/alertController.js';

const router = express.Router();

// Alert management
router.get('/:userId', AlertController.getUserAlerts);
router.get('/:userId/unread-count', AlertController.getUnreadAlertCount);
router.get('/:userId/stats', AlertController.getAlertStats);

// Alert actions
router.put('/:userId/:alertId/read', AlertController.markAlertAsRead);
router.put('/:userId/mark-all-read', AlertController.markAllAlertsAsRead);

// Manual alert triggering
router.post('/:userId/:budgetId/check', AlertController.triggerBudgetAlertCheck);
router.post('/test', AlertController.testAlert);
router.post('/test-email', AlertController.testEmail);

export default router;
