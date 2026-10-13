import { Router } from "express";
import {
  getMaintenanceTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from "../controllers/maintenance.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../validators/schemas";

const router = Router();

router.get("/", authenticate, getMaintenanceTickets);
router.get("/:id", authenticate, getTicketById);

router.post("/", authenticate, validate(createMaintenanceSchema), createTicket);

router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateMaintenanceSchema),
  updateTicket
);

router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteTicket);

export default router;
