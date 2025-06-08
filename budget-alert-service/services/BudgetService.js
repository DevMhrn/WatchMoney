import pool from '../config/database.js';
import dayjs from 'dayjs';

class BudgetService {
    
    /**
     * Create a new budget for a user
     */
    async createBudget(budgetData) {
        const client = await pool.connect();
        try {
            const {
                user_id,
                category_id,
                budget_name,
                budget_amount,
                period_type = 'monthly',
                start_date,
                end_date,
                currency = 'USD',
                alert_threshold_percentage = 80
            } = budgetData;

            // Validate required fields
            if (!user_id || !budget_name || !budget_amount || !start_date || !end_date) {
                throw new Error('Missing required fields for budget creation');
            }

            // Validate date range
            if (new Date(end_date) <= new Date(start_date)) {
                throw new Error('End date must be after start date');
            }

            const query = `
                INSERT INTO tblbudget (
                    user_id, category_id, budget_name, budget_amount, 
                    period_type, start_date, end_date, currency, alert_threshold_percentage
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;

            const values = [
                user_id, category_id, budget_name, budget_amount,
                period_type, start_date, end_date, currency, alert_threshold_percentage
            ];

            const result = await client.query(query, values);
            
            // Initialize budget spending record
            await this.initializeBudgetSpending(result.rows[0].id, user_id, start_date, end_date);
            
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Get all budgets for a user
     */
    async getUserBudgets(userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    b.*,
                    c.name as category_name,
                    c.type as category_type,
                    bs.total_spent,
                    bs.transaction_count,
                    bs.period_start,
                    bs.period_end,
                    CASE 
                        WHEN b.budget_amount > 0 THEN 
                            ROUND((COALESCE(bs.total_spent, 0) / b.budget_amount * 100), 2)
                        ELSE 0 
                    END as percentage_used
                FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                LEFT JOIN tblbudgetspending bs ON b.id = bs.budget_id 
                    AND bs.period_start <= CURRENT_DATE 
                    AND bs.period_end >= CURRENT_DATE
                WHERE b.user_id = $1 AND b.is_active = true
                ORDER BY b.created_at DESC
            `;

            const result = await client.query(query, [userId]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Get a specific budget by ID
     */
    async getBudgetById(budgetId, userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT b.*, c.name as category_name, c.type as category_type
                FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE b.id = $1 AND b.user_id = $2 AND b.is_active = true
            `;

            const result = await client.query(query, [budgetId, userId]);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    /**
     * Update a budget
     */
    async updateBudget(budgetId, userId, updateData) {
        const client = await pool.connect();
        try {
            const existingBudget = await this.getBudgetById(budgetId, userId);
            if (!existingBudget) {
                throw new Error('Budget not found');
            }

            const allowedFields = [
                'budget_name', 'budget_amount', 'period_type', 
                'start_date', 'end_date', 'currency', 'alert_threshold_percentage'
            ];

            const updates = [];
            const values = [];
            let paramCount = 1;

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    updates.push(`${key} = $${paramCount}`);
                    values.push(value);
                    paramCount++;
                }
            }

            if (updates.length === 0) {
                throw new Error('No valid fields to update');
            }

            updates.push(`updated_at = CURRENT_TIMESTAMP`);
            values.push(budgetId, userId);

            const query = `
                UPDATE tblbudget 
                SET ${updates.join(', ')}
                WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
                RETURNING *
            `;

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Delete/Deactivate a budget
     */
    async deleteBudget(budgetId, userId) {
        const client = await pool.connect();
        try {
            const query = `
                UPDATE tblbudget 
                SET is_active = false, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `;

            const result = await client.query(query, [budgetId, userId]);
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }

    /**
     * Calculate current spending for a budget
     */
    async calculateBudgetSpending(budgetId, userId) {
        const client = await pool.connect();
        try {
            const query = `SELECT * FROM get_budget_current_spending($1, $2)`;
            const result = await client.query(query, [budgetId, userId]);
            return result.rows[0] || { total_spent: 0, transaction_count: 0 };
        } finally {
            client.release();
        }
    }

    /**
     * Update budget spending cache
     */
    async updateBudgetSpending(budgetId, userId) {
        const client = await pool.connect();
        try {
            const spending = await this.calculateBudgetSpending(budgetId, userId);
            
            if (!spending.period_start || !spending.period_end) {
                return;
            }

            const query = `
                INSERT INTO tblbudgetspending (
                    budget_id, user_id, period_start, period_end, 
                    total_spent, transaction_count, last_updated
                )
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
                ON CONFLICT (budget_id, period_start, period_end)
                DO UPDATE SET 
                    total_spent = EXCLUDED.total_spent,
                    transaction_count = EXCLUDED.transaction_count,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;

            const values = [
                budgetId, userId, spending.period_start, spending.period_end,
                spending.total_spent, spending.transaction_count
            ];

            const result = await client.query(query, values);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    /**
     * Initialize budget spending record
     */
    async initializeBudgetSpending(budgetId, userId, startDate, endDate) {
        const client = await pool.connect();
        try {
            const periodStart = dayjs(startDate).format('YYYY-MM-DD');
            const periodEnd = dayjs(endDate).format('YYYY-MM-DD');

            const query = `
                INSERT INTO tblbudgetspending (
                    budget_id, user_id, period_start, period_end, 
                    total_spent, transaction_count
                )
                VALUES ($1, $2, $3, $4, 0, 0)
                ON CONFLICT (budget_id, period_start, period_end) DO NOTHING
            `;

            await client.query(query, [budgetId, userId, periodStart, periodEnd]);
        } finally {
            client.release();
        }
    }

    /**
     * Get budgets that may be affected by a transaction
     */
    async getAffectedBudgets(userId, categoryId, transactionDate) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT * FROM tblbudget 
                WHERE user_id = $1 
                    AND (category_id = $2 OR category_id IS NULL)
                    AND is_active = true
                    AND start_date <= $3 
                    AND end_date >= $3
            `;

            const result = await client.query(query, [userId, categoryId, transactionDate]);
            return result.rows;
        } finally {
            client.release();
        }
    }
}

export default new BudgetService();
