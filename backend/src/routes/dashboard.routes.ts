import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

// Dashboard stats endpoint
router.get("/stats", authenticate, getDashboardStats);

export default router;
