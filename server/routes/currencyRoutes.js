import express from "express";
import {
    getExchangeRates,
    getSupportedCurrencies,
    getConsolidatedReport
} from "../controllers/currencyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/exchange-rates", authMiddleware, getExchangeRates);
router.get("/supported-currencies", authMiddleware, getSupportedCurrencies);
router.get("/consolidated-report", authMiddleware, getConsolidatedReport);

export default router;
