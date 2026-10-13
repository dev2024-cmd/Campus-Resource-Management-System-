import { Router } from "express";
import {
  getUtilizationReport,
  getMaintenanceCostReport,
  exportResourcesCSV,
  exportBookingsCSV,
} from "../controllers/report.controller";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.use(authorize("superadmin", "admin"));

router.get("/utilization", getUtilizationReport);
router.get("/maintenance-costs", getMaintenanceCostReport);
router.get("/export/resources", exportResourcesCSV);
router.get("/export/bookings", exportBookingsCSV);

export default router;
