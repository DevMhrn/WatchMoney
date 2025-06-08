import pool from '../config/database.js';
import emailConfig from '../config/email.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

class AlertService {

    /**
     * Check budget thresholds and send alerts if needed
     */
    async checkAndSendAlerts(userId, budgetId) {
        const client = await pool.connect();
        try {
            // Get budget with current spending
            const budgetQuery = `
                SELECT 
                    b.*,
                    c.name as category_name,
                    bs.total_spent,
                    bs.transaction_count,
                    CASE 
                        WHEN b.budget_amount > 0 THEN 
                            ROUND((COALESCE(bs.total_spent, 0) / b.budget_amount * 100), 2)
                        ELSE 0 
                    END as percentage_used,
                    u.email,
                    u.firstName,
                    u.lastName,
                    np.email_alerts,
                    np.threshold_warning,
                    np.threshold_critical
                FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                LEFT JOIN tblbudgetspending bs ON b.id = bs.budget_id 
                    AND bs.period_start <= CURRENT_DATE 
                    AND bs.period_end >= CURRENT_DATE
                LEFT JOIN tbluser u ON b.user_id = u.id
                LEFT JOIN tblnotificationpreference np ON b.user_id = np.user_id
                WHERE b.id = $1 AND b.user_id = $2 AND b.is_active = true
            `;

            const budgetResult = await client.query(budgetQuery, [budgetId, userId]);
            
            if (budgetResult.rows.length === 0) {
                return { success: false, message: 'Budget not found' };
            }

            const budget = budgetResult.rows[0];
            const thresholdWarning = budget.threshold_warning || budget.alert_threshold_percentage || 80;
            const thresholdCritical = budget.threshold_critical || 100;

            // Check if we need to send alerts
            const alertType = this.determineAlertType(budget.percentage_used, thresholdWarning, thresholdCritical);
            
            if (!alertType || !budget.email_alerts) {
                return { success: true, message: 'No alert needed' };
            }

            // Check if alert was already sent recently
            const recentAlertExists = await this.checkRecentAlert(budgetId, userId, alertType);
            if (recentAlertExists) {
                return { success: true, message: 'Alert already sent recently' };
            }

            // Create alert record
            const alert = await this.createAlert(budget, alertType);

            // Send email if enabled
            if (budget.email_alerts && budget.email) {
                await this.sendEmailAlert(budget, alert);
                await this.markAlertEmailSent(alert.id);
            }

            return { 
                success: true, 
                alert, 
                message: `${alertType} alert sent successfully` 
            };

        } finally {
            client.release();
        }
    }

    /**
     * Determine what type of alert to send based on percentage
     */
    determineAlertType(percentageUsed, warningThreshold, criticalThreshold) {
        if (percentageUsed >= criticalThreshold) {
            return 'exceeded';
        } else if (percentageUsed >= warningThreshold) {
            return 'warning';
        }
        return null;
    }

    /**
     * Check if a similar alert was sent recently (within last 24 hours)
     */
    async checkRecentAlert(budgetId, userId, alertType) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT id FROM tblbudgetalert 
                WHERE budget_id = $1 
                    AND user_id = $2 
                    AND alert_type = $3 
                    AND created_at > (CURRENT_TIMESTAMP - INTERVAL '24 hours')
                LIMIT 1
            `;

            const result = await client.query(query, [budgetId, userId, alertType]);
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }

    /**
     * Create alert record in database
     */
    async createAlert(budget, alertType) {
        const client = await pool.connect();
        try {
            const message = this.generateAlertMessage(budget, alertType);

            const query = `
                INSERT INTO tblbudgetalert (
                    budget_id, user_id, alert_type, current_spent, 
                    budget_amount, percentage_used, message
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;

            const values = [
                budget.id,
                budget.user_id,
                alertType,
                budget.total_spent || 0,
                budget.budget_amount,
                budget.percentage_used,
                message
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Generate alert message based on type and budget data
     */
    generateAlertMessage(budget, alertType) {
        const categoryName = budget.category_name || 'General';
        const spentAmount = formatCurrency(budget.total_spent || 0, budget.currency);
        const budgetAmount = formatCurrency(budget.budget_amount, budget.currency);
        const percentage = budget.percentage_used;

        switch (alertType) {
            case 'warning':
                return `Budget Alert: You've spent ${spentAmount} (${percentage}%) of your ${budgetAmount} ${categoryName} budget for this ${budget.period_type}.`;
            
            case 'exceeded':
                return `Budget Exceeded: You've spent ${spentAmount} (${percentage}%) of your ${budgetAmount} ${categoryName} budget for this ${budget.period_type}. Consider reviewing your spending.`;
            
            case 'critical':
                return `Critical Budget Alert: You've significantly exceeded your ${budgetAmount} ${categoryName} budget with ${spentAmount} spent (${percentage}%).`;
            
            default:
                return `Budget notification for ${categoryName}: ${spentAmount} spent of ${budgetAmount} budget.`;
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(budget, alert) {
        try {
            const transporter = emailConfig.getTransporter();
            const fromAddress = emailConfig.getDefaultFromAddress();

            if (!transporter) {
                throw new Error('Email transporter not configured');
            }

            const emailSubject = this.getEmailSubject(alert.alert_type, budget.category_name);
            const emailBody = this.getEmailBody(budget, alert);

            const mailOptions = {
                from: fromAddress,
                to: budget.email,
                subject: emailSubject,
                html: emailBody,
                text: alert.message // Fallback plain text
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Alert email sent successfully:', result.messageId);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to send alert email:', error.message);
            throw error;
        }
    }

    /**
     * Get email subject based on alert type
     */
    getEmailSubject(alertType, categoryName) {
        const category = categoryName || 'Budget';
        
        switch (alertType) {
            case 'warning':
                return `⚠️ Budget Warning - ${category}`;
            case 'exceeded':
                return `🚨 Budget Exceeded - ${category}`;
            case 'critical':
                return `🔴 Critical Budget Alert - ${category}`;
            default:
                return `📊 Budget Notification - ${category}`;
        }
    }

    /**
     * Generate HTML email body
     */
    getEmailBody(budget, alert) {
        const userName = budget.firstName ? `${budget.firstName} ${budget.lastName || ''}`.trim() : 'User';
        const categoryName = budget.category_name || 'General';
        const spentAmount = formatCurrency(budget.total_spent || 0, budget.currency);
        const budgetAmount = formatCurrency(budget.budget_amount, budget.currency);
        const percentage = budget.percentage_used;

        const alertColor = alert.alert_type === 'exceeded' ? '#dc3545' : '#ffc107';
        const alertIcon = alert.alert_type === 'exceeded' ? '🚨' : '⚠️';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Budget Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">${alertIcon} Budget Alert</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">DdevFinance Budget Monitoring</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
                <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
                
                <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid ${alertColor}; margin: 20px 0;">
                    <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${alertColor};">
                        ${alert.message}
                    </p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Budget Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Category:</td>
                            <td style="padding: 8px 0;">${categoryName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Budget Amount:</td>
                            <td style="padding: 8px 0;">${budgetAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Amount Spent:</td>
                            <td style="padding: 8px 0; color: ${alertColor}; font-weight: bold;">${spentAmount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Percentage Used:</td>
                            <td style="padding: 8px 0; color: ${alertColor}; font-weight: bold;">${percentage}%</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Period:</td>
                            <td style="padding: 8px 0;">${budget.period_type.charAt(0).toUpperCase() + budget.period_type.slice(1)}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.API_BASE_URL || 'http://localhost:3000'}/dashboard" 
                       style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        View Your Dashboard
                    </a>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    This is an automated message from DdevFinance Budget Alert Service. 
                    You can manage your notification preferences in your account settings.
                </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; color: #666; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} DdevFinance. All rights reserved.</p>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Mark alert as email sent
     */
    async markAlertEmailSent(alertId) {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE tblbudgetalert 
                SET email_sent = true, email_sent_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `;

            await client.query(query, [alertId]);
        } finally {
            client.release();
        }
    }

    /**
     * Get all alerts for a user
     */
    async getUserAlerts(userId, limit = 50, offset = 0) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    a.*,
                    b.budget_name,
                    c.name as category_name
                FROM tblbudgetalert a
                LEFT JOIN tblbudget b ON a.budget_id = b.id
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE a.user_id = $1
                ORDER BY a.created_at DESC
                LIMIT $2 OFFSET $3
            `;

            const result = await client.query(query, [userId, limit, offset]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Mark alert as read
     */
    async markAlertAsRead(alertId, userId) {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE tblbudgetalert 
                SET is_read = true, read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `;

            const result = await client.query(query, [alertId, userId]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Get unread alert count for a user
     */
    async getUnreadAlertCount(userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT COUNT(*) as unread_count
                FROM tblbudgetalert 
                WHERE user_id = $1 AND is_read = false
            `;

            const result = await client.query(query, [userId]);
            return parseInt(result.rows[0].unread_count);
        } finally {
            client.release();
        }
    }
}

export default new AlertService();
