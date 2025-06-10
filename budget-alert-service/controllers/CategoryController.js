import pool from '../config/database.js';
import { 
    successResponse, 
    errorResponse, 
    validationErrorResponse 
} from '../utils/responseHelpers.js';

class CategoryController {

    /**
     * Get categories with optional type filtering
     * GET /categories?type=expense,budget
     */
    async getCategories(req, res) {
        try {
            const { type } = req.query;
            
            let query = `
                SELECT id, name, description, color_code, icon_name, type, is_system
                FROM tblcategory 
                WHERE is_active = true
            `;
            
            const params = [];
            
            if (type) {
                const types = type.split(',').map(t => t.trim());
                // For budget forms, if 'expense' is requested, only return expense categories
                // Budget categories are administrative, expense categories are what users spend on
                query += ` AND type = ANY($1)`;
                params.push(types);
            }
            
            query += ` ORDER BY is_system DESC, name ASC`;
            
            const result = await pool.query(query, params);
            
            res.json(
                successResponse(result.rows, 'Categories retrieved successfully')
            );
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get categories by specific type
     * GET /categories/type/:type
     */
    async getCategoriesByType(req, res) {
        try {
            const { type } = req.params;
            
            if (!['income', 'expense', 'transfer', 'budget'].includes(type)) {
                return res.status(400).json(
                    validationErrorResponse(['Invalid category type'])
                );
            }
            
            const query = `
                SELECT id, name, description, color_code, icon_name, type, is_system
                FROM tblcategory 
                WHERE type = $1 AND is_active = true
                ORDER BY is_system DESC, name ASC
            `;
            
            const result = await pool.query(query, [type]);
            
            res.json(
                successResponse(result.rows, `${type} categories retrieved successfully`)
            );
        } catch (error) {
            console.error('Error fetching categories by type:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }

    /**
     * Get all available category types
     * GET /categories/types
     */
    async getCategoryTypes(req, res) {
        try {
            const query = `
                SELECT DISTINCT type 
                FROM tblcategory 
                WHERE is_active = true
                ORDER BY type
            `;
            
            const result = await pool.query(query);
            const types = result.rows.map(row => row.type);
            
            res.json(
                successResponse(types, 'Category types retrieved successfully')
            );
        } catch (error) {
            console.error('Error fetching category types:', error);
            res.status(500).json(
                errorResponse(error.message)
            );
        }
    }
}

export default new CategoryController();
