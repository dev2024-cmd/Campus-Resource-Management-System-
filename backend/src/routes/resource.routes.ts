import { Router } from "express";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createResourceSchema, updateResourceSchema } from "../validators/schemas";

const router = Router();

// Read operations are accessible to all authenticated campus members
router.get("/", getResources);
router.get("/:id", getResourceById);

// Creation allowed by superadmin, admin, lecturer
router.post(
  "/",
  authenticate,
  authorize("superadmin", "admin", "lecturer"),
  validate(createResourceSchema),
  createResource
);

// Updates and Deletions restricted to administrators
router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateResourceSchema),
  updateResource
);

router.patch(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateResourceSchema),
  updateResource
);

router.delete(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  deleteResource
);

export default router;
