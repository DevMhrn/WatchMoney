import express from 'express';
import userRoutes from './userRoutes.js';
import accountRoutes from './accountRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import authRoutes from './authRoutes.js';
import accountTypeRoutes from './accountTypeRoutes.js';
import currencyRoutes from './currencyRoutes.js';
import categoryRoutes from './categoryRoutes.js';


const router = express.Router();

router.use('/users', userRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/auth', authRoutes);
router.use('/account-type', accountTypeRoutes);
router.use('/currency', currencyRoutes);
router.use('/categories', categoryRoutes);



export default router;