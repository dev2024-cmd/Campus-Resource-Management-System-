import { Router } from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
  getAlternativeResources,
} from "../controllers/booking.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema, updateBookingStatusSchema } from "../validators/schemas";

const router = Router();

router.get("/", authenticate, getBookings);
router.get("/alternatives", authenticate, getAlternativeResources);
router.get("/:id", authenticate, getBookingById);

router.post("/", authenticate, validate(createBookingSchema), createBooking);

router.patch(
  "/:id/status",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateBookingStatusSchema),
  updateBookingStatus
);

router.put("/:id", authenticate, updateBooking);
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteBooking);

export default router;
