import AlertService from '../services/AlertService.js';
import emailConfig from '../config/email.js';
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse,
    notFoundResponse,
    paginatedResponse 
} from '../utils/responseHelpers.js';
import { validatePagination } from '../utils/validators.js';
import { isValidUUID } from '../utils/formatters.js';

class AlertController {

    /**
     * Get all alerts for a user
     * GET /alerts/:userId
     */
    async getUserAlerts(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            const pagination = validatePagination(req.query);
            
            const alerts = await AlertService.getUserAlerts(
                userId, 
                pagination.limit, 
                pagination.offset
            );

            // For now, return simple response. In a full implementation, 
            // you'd also get total count for proper pagination
            res.json(
                successResponse(alerts, 'Alerts retrieved successfully')
            );

        } catch (error) {
            console.error('Error fetching user alerts:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Mark an alert as read
     * PUT /alerts/:userId/:alertId/read
     */
    async markAlertAsRead(req, res) {
        try {
            const { userId, alertId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(alertId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or alert ID format'])
                );
            }

            const updatedAlert = await AlertService.markAlertAsRead(alertId, userId);

            if (!updatedAlert) {
                return res.status(404).json(
                    notFoundResponse('Alert')
                );
            }

            res.json(
                successResponse(updatedAlert, 'Alert marked as read')
            );

        } catch (error) {
            console.error('Error marking alert as read:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get unread alert count for a user
     * GET /alerts/:userId/unread-count
     */
    async getUnreadAlertCount(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            const unreadCount = await AlertService.getUnreadAlertCount(userId);

            res.json(
                successResponse({ unreadCount }, 'Unread alert count retrieved')
            );

        } catch (error) {
            console.error('Error fetching unread alert count:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Manually trigger alert check for a specific budget
     * POST /alerts/:userId/:budgetId/check
     */
    async triggerBudgetAlertCheck(req, res) {
        try {
            const { userId, budgetId } = req.params;

            if (!isValidUUID(userId) || !isValidUUID(budgetId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID or budget ID format'])
                );
            }

            const result = await AlertService.checkAndSendAlerts(userId, budgetId);

            res.json(
                successResponse(result, 'Budget alert check completed')
            );

        } catch (error) {
            console.error('Error triggering budget alert check:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get alert statistics for a user
     * GET /alerts/:userId/stats
     */
    async getAlertStats(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            // Get all alerts for the user (we could optimize this with specific queries)
            const allAlerts = await AlertService.getUserAlerts(userId, 1000, 0);
            
            const stats = {
                totalAlerts: allAlerts.length,
                unreadAlerts: allAlerts.filter(alert => !alert.is_read).length,
                alertsByType: allAlerts.reduce((acc, alert) => {
                    acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
                    return acc;
                }, {}),
                emailsSent: allAlerts.filter(alert => alert.email_sent).length,
                alertsThisWeek: allAlerts.filter(alert => {
                    const alertDate = new Date(alert.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return alertDate > weekAgo;
                }).length,
                alertsThisMonth: allAlerts.filter(alert => {
                    const alertDate = new Date(alert.created_at);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return alertDate > monthAgo;
                }).length
            };

            res.json(
                successResponse(stats, 'Alert statistics retrieved')
            );

        } catch (error) {
            console.error('Error fetching alert statistics:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Test alert sending (for debugging)
     * POST /alerts/test
     */
    async testAlert(req, res) {
        try {
            const { user_id, budget_id, alert_type = 'warning' } = req.body;

            if (!user_id || !budget_id) {
                return res.status(400).json(
                    validationErrorResponse(['user_id and budget_id are required for testing'])
                );
            }

            if (!isValidUUID(user_id) || !isValidUUID(budget_id)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user_id or budget_id format'])
                );
            }

            const result = await AlertService.checkAndSendAlerts(user_id, budget_id);

            res.json(
                successResponse(result, 'Test alert processed')
            );

        } catch (error) {
            console.error('Error sending test alert:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Mark all alerts as read for a user
     * PUT /alerts/:userId/mark-all-read
     */
    async markAllAlertsAsRead(req, res) {
        try {
            const { userId } = req.params;

            if (!isValidUUID(userId)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid user ID format'])
                );
            }

            // Get all unread alerts and mark them as read
            const unreadAlerts = await AlertService.getUserAlerts(userId, 1000, 0);
            const unreadCount = unreadAlerts.filter(alert => !alert.is_read).length;

            // In a real implementation, you'd do this in a single query
            const markPromises = unreadAlerts
                .filter(alert => !alert.is_read)
                .map(alert => AlertService.markAlertAsRead(alert.id, userId));

            await Promise.all(markPromises);

            res.json(
                successResponse(
                    { markedCount: unreadCount }, 
                    `${unreadCount} alerts marked as read`
                )
            );

        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Test email configuration (currently disabled)
     * POST /alerts/test-email
     */
    async testEmail(req, res) {
        try {
            // Email service temporarily disabled
            console.log('📧 Test email skipped - email service is disabled');
            
            res.json(
                successResponse(
                    { 
                        success: true, 
                        message: 'Email service is currently disabled',
                        status: 'disabled'
                    }, 
                    'Email service disabled'
                )
            );

            /* Original email test code (commented out):
            const { to } = req.body;
            const testEmail = to || 'devlearncoding37@gmail.com';

            const result = await emailConfig.sendTestEmail(testEmail);

            res.json(
                successResponse(result, 'Test email sent successfully')
            );
            */

        } catch (error) {
            console.error('Error in test email endpoint:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }
}

export default new AlertController();
