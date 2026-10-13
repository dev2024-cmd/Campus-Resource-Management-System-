import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createCategorySchema, updateCategorySchema } from "../validators/schemas";

const router = Router();

router.get("/", getCategories);
router.post(
  "/",
  authenticate,
  authorize("superadmin", "admin"),
  validate(createCategorySchema),
  createCategory
);
router.put(
  "/:id",
  authenticate,
  authorize("superadmin", "admin"),
  validate(updateCategorySchema),
  updateCategory
);
router.delete("/:id", authenticate, authorize("superadmin", "admin"), deleteCategory);

export default router;
