import { Router } from "express";
import { login, getMe, logout } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { loginSchema } from "../validators/schemas";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
