import { Router } from "express";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createLocationSchema, updateLocationSchema } from "../validators/schemas";

const router = Router();

router.get("/", getLocations);
router.post(
  "/",
  authenticate,
  authorize("superadmin", "admin"),
  validate(createLocationSchema),
  createLocation
);
router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateLocationSchema),
  updateLocation
);
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteLocation);

export default router;
