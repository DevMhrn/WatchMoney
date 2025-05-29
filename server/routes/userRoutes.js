import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getUser, updateUser, changePasswordOfUser } from '../controllers/userController.js';
const router = express.Router();

router.get('/', authMiddleware, getUser);
router.put('/change-password', authMiddleware, changePasswordOfUser);
// router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);



export default router;