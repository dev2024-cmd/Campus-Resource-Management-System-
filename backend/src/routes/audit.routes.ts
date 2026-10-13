import { Router } from "express";
import { getAuditLogs } from "../controllers/audit.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(authorize("superadmin", "admin"));

router.get("/", getAuditLogs);

export default router;
