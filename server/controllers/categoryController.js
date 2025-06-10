import { pool } from '../config/dbConfig.js';

export const getCategories = async (req, res) => {
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
      query += ` AND type = ANY($1)`;
      params.push(types);
    }
    
    query += ` ORDER BY is_system DESC, name ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

export const getCategoriesByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['income', 'expense', 'transfer', 'budget'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category type'
      });
    }
    
    const query = `
      SELECT id, name, description, color_code, icon_name, type, is_system
      FROM tblcategory 
      WHERE type = $1 AND is_active = true
      ORDER BY is_system DESC, name ASC
    `;
    
    const result = await pool.query(query, [type]);
    
    res.json({
      success: true,
      data: result.rows,
      message: `${type} categories retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching categories by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};
