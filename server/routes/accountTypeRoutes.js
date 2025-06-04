import express from "express";
import {
  getAccountTypes,
  createAccountType,
} from "../controllers/accountTypeControllers.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAccountTypes); 
router.post("/create", authMiddleware, createAccountType); 

export default router;