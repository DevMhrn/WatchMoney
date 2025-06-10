import express from 'express';
import CategoryController from '../controllers/CategoryController.js';

const router = express.Router();

// Get categories with optional type filtering
router.get('/', CategoryController.getCategories);

// Get categories by type
router.get('/type/:type', CategoryController.getCategoriesByType);

// Get all category types
router.get('/types', CategoryController.getCategoryTypes);

export default router;
