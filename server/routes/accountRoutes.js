import express from "express";
import {
  addMoneyToAccount,
  createAccount,
  getAccounts,
} from "../controllers/accountControllers.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAccounts);
router.post("/create", authMiddleware, createAccount);
router.put("/add-money/:id", authMiddleware, addMoneyToAccount);

export default router;