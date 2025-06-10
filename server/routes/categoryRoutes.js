import express from 'express';
import { getCategories, getCategoriesByType } from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get categories with optional type filtering
router.get('/', authMiddleware, getCategories);

// Get categories by specific type
router.get('/type/:type', authMiddleware, getCategoriesByType);

export default router;
