import pool from '../config/database.js';
import dayjs from 'dayjs';

class BudgetService {
    
    /**
     * Check for existing budgets that would conflict with new budget
     */
    async checkBudgetConflicts(userId, categoryId, startDate, endDate, excludeBudgetId = null) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    b.id, 
                    b.budget_name, 
                    b.period_type,
                    b.start_date,
                    b.end_date,
                    c.name as category_name
                FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE b.user_id = $1 
                    AND b.category_id = $2
                    AND b.is_active = true
                    AND (
                        (b.start_date <= $3 AND b.end_date >= $3) OR  -- New start overlaps existing
                        (b.start_date <= $4 AND b.end_date >= $4) OR  -- New end overlaps existing
                        (b.start_date >= $3 AND b.end_date <= $4)     -- Existing is within new range
                    )
                    ${excludeBudgetId ? 'AND b.id != $5' : ''}
                ORDER BY b.start_date ASC
            `;

            const params = excludeBudgetId 
                ? [userId, categoryId, startDate, endDate, excludeBudgetId]
                : [userId, categoryId, startDate, endDate];

            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    /**
     * Create a new budget for a user with conflict checking
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
                alert_threshold_percentage = 80,
                allow_overlapping = false // New flag to allow overlapping budgets
            } = budgetData;

            // Validate required fields
            if (!user_id || !budget_name || !budget_amount || !start_date || !end_date) {
                throw new Error('Missing required fields for budget creation');
            }

            // Validate date range
            if (new Date(end_date) <= new Date(start_date)) {
                throw new Error('End date must be after start date');
            }

            // Check for conflicting budgets (unless explicitly allowing overlaps)
            if (!allow_overlapping && category_id) {
                const conflicts = await this.checkBudgetConflicts(user_id, category_id, start_date, end_date);
                
                if (conflicts.length > 0) {
                    const conflictDetails = conflicts.map(c => 
                        `"${c.budget_name}" (${c.start_date} to ${c.end_date})`
                    ).join(', ');
                    
                    throw new Error(
                        `Budget conflict detected! There are already budgets for "${conflicts[0].category_name}" category that overlap with your selected dates: ${conflictDetails}. ` +
                        `Please choose different dates or modify existing budgets.`
                    );
                }
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
            
            console.log(`✅ Budget created successfully: ${budget_name} for ${result.rows[0].id}`);
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
     * Update a budget with conflict checking
     */
    async updateBudget(budgetId, userId, updateData) {
        const client = await pool.connect();
        try {
            const existingBudget = await this.getBudgetById(budgetId, userId);
            if (!existingBudget) {
                throw new Error('Budget not found');
            }

            // Check for conflicts if category or dates are being updated
            if ((updateData.category_id || updateData.start_date || updateData.end_date) && !updateData.allow_overlapping) {
                const newCategoryId = updateData.category_id || existingBudget.category_id;
                const newStartDate = updateData.start_date || existingBudget.start_date;
                const newEndDate = updateData.end_date || existingBudget.end_date;

                if (newCategoryId) {
                    const conflicts = await this.checkBudgetConflicts(userId, newCategoryId, newStartDate, newEndDate, budgetId);
                    
                    if (conflicts.length > 0) {
                        const conflictDetails = conflicts.map(c => 
                            `"${c.budget_name}" (${c.start_date} to ${c.end_date})`
                        ).join(', ');
                        
                        throw new Error(
                            `Update would create budget conflict! There are already budgets that would overlap: ${conflictDetails}. ` +
                            `Please choose different dates or modify existing budgets.`
                        );
                    }
                }
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
     * Calculate current spending for a budget - Fixed to use category_id and handle currency conversion
     */
    async calculateBudgetSpending(budgetId, userId) {
        const client = await pool.connect();
        try {
            // Get budget details first
            const budgetQuery = `
                SELECT b.*, c.name as category_name, c.id as category_id FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE b.id = $1 AND b.user_id = $2 AND b.is_active = true
            `;
            const budgetResult = await client.query(budgetQuery, [budgetId, userId]);
            
            if (budgetResult.rows.length === 0) {
                throw new Error('Budget not found');
            }

            const budget = budgetResult.rows[0];

            // Calculate spending using the budget spending cache table which should be updated by microservice
            // First check if we have recent spending data in cache
            const cacheQuery = `
                SELECT 
                    total_spent,
                    transaction_count,
                    period_start,
                    period_end,
                    last_updated
                FROM tblbudgetspending 
                WHERE budget_id = $1 
                    AND period_start <= CURRENT_DATE 
                    AND period_end >= CURRENT_DATE
                ORDER BY last_updated DESC 
                LIMIT 1
            `;

            const cacheResult = await client.query(cacheQuery, [budgetId]);

            if (cacheResult.rows.length > 0) {
                // Use cached data if available and recent
                const cached = cacheResult.rows[0];
                console.log(`💰 Using cached budget spending for ${budget.category_name}:`, {
                    totalSpent: cached.total_spent,
                    transactionCount: cached.transaction_count,
                    lastUpdated: cached.last_updated
                });

                return {
                    total_spent: parseFloat(cached.total_spent),
                    transaction_count: parseInt(cached.transaction_count),
                    period_start: cached.period_start,
                    period_end: cached.period_end
                };
            }

            // Fallback: Calculate directly from transactions using category_id
            const spendingQuery = `
                SELECT 
                    COALESCE(SUM(t.amount), 0) as total_spent,
                    COUNT(t.id) as transaction_count,
                    $3::date as period_start,
                    $4::date as period_end
                FROM tbltransaction t
                WHERE t.user_id = $1 
                    AND t.category_id = $2
                    AND DATE(t.created_at) >= $3::date
                    AND DATE(t.created_at) <= $4::date
                    AND t.type = 'expense'
                    AND t.status = 'Completed'
            `;

            console.log(`💰 Calculating budget spending for ${budget.category_name} (${budget.category_id}) in ${budget.currency}:`, {
                period: `${budget.start_date} to ${budget.end_date}`,
                budgetCurrency: budget.currency,
                categoryId: budget.category_id
            });

            const spendingResult = await client.query(spendingQuery, [
                userId, 
                budget.category_id, // Use category_id instead of category_name
                budget.start_date, 
                budget.end_date
            ]);

            const result = spendingResult.rows[0] || { 
                total_spent: 0, 
                transaction_count: 0,
                period_start: budget.start_date,
                period_end: budget.end_date
            };

            console.log(`📊 Budget spending calculation result:`, {
                budgetName: budget.budget_name,
                totalSpent: result.total_spent,
                budgetAmount: budget.budget_amount,
                currency: budget.currency,
                transactionCount: result.transaction_count,
                method: 'direct_calculation'
            });

            return result;
        } finally {
            client.release();
        }
    }

    /**
     * Update budget spending cache - Enhanced to store converted amounts
     */
    async updateBudgetSpending(budgetId, userId, transactionAmount = null) {
        const client = await pool.connect();
        try {
            // Get budget details to determine the period
            const budgetQuery = `
                SELECT b.*, c.name as category_name FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE b.id = $1 AND b.user_id = $2 AND b.is_active = true
            `;
            const budgetResult = await client.query(budgetQuery, [budgetId, userId]);
            
            if (budgetResult.rows.length === 0) {
                throw new Error('Budget not found');
            }

            const budget = budgetResult.rows[0];

            // Get current spending from cache
            const cacheQuery = `
                SELECT 
                    total_spent,
                    transaction_count,
                    period_start,
                    period_end
                FROM tblbudgetspending 
                WHERE budget_id = $1 
                    AND period_start <= CURRENT_DATE 
                    AND period_end >= CURRENT_DATE
                ORDER BY last_updated DESC 
                LIMIT 1
            `;

            const cacheResult = await client.query(cacheQuery, [budgetId]);
            
            let currentSpent = 0;
            let currentCount = 0;
            
            if (cacheResult.rows.length > 0) {
                currentSpent = parseFloat(cacheResult.rows[0].total_spent);
                currentCount = parseInt(cacheResult.rows[0].transaction_count);
            }

            // Add the new transaction amount if provided
            if (transactionAmount !== null) {
                console.log(`💰 Adding transaction amount ${transactionAmount} to existing spending ${currentSpent}`);
                currentSpent += parseFloat(transactionAmount);
                currentCount += 1;
            }

            // Update the cache
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
                budgetId, 
                userId, 
                budget.start_date, 
                budget.end_date,
                currentSpent, 
                currentCount
            ];

            console.log(`💾 Updating budget spending cache:`, {
                budgetId,
                budgetName: budget.budget_name,
                totalSpent: currentSpent,
                transactionCount: currentCount,
                addedAmount: transactionAmount
            });

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
            console.log('🔍 Looking for affected budgets:', {
                userId,
                categoryId,
                transactionDate,
                categoryIdType: typeof categoryId
            });

            // Now we always expect a UUID, not a name
            const query = `
                SELECT b.*, c.name as category_name FROM tblbudget b
                LEFT JOIN tblcategory c ON b.category_id = c.id
                WHERE b.user_id = $1 
                    AND b.category_id = $2
                    AND b.is_active = true
                    AND b.start_date <= $3 
                    AND b.end_date >= $3
            `;
            
            const params = [userId, categoryId, transactionDate];

            const result = await client.query(query, params);
            
            console.log('📊 Found affected budgets:', {
                count: result.rows.length,
                budgets: result.rows.map(b => ({ id: b.id, name: b.budget_name, category: b.category_name }))
            });

            return result.rows;
        } catch (error) {
            console.error('❌ Error finding affected budgets:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new BudgetService();
